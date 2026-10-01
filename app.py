from flask import Flask,render_template,request,jsonify
import joblib,os
import numpy as np
import pandas as pd
from datetime import datetime
from math import radians,sin,cos,sqrt,atan2
from database import get_db_connection

app=Flask(__name__)
BASE_DIR=os.path.dirname(os.path.abspath(__file__))

# =========================
# ML MODELS
# =========================

xgb_model=joblib.load(os.path.join(BASE_DIR,"models","final_xgboost.pkl"))
rf_model=joblib.load(os.path.join(BASE_DIR,"models","random_forest.pkl"))
lr_model=joblib.load(os.path.join(BASE_DIR,"models","logistic_regression.pkl"))
ohe=joblib.load(os.path.join(BASE_DIR,"models","one_hot_encoder.pkl"))
target_encoder=joblib.load(os.path.join(BASE_DIR,"models","target_encoder.pkl"))

print("ML models and encoders loaded successfully.")

def get_model(name):
    if name=="random_forest":
        return rf_model
    if name=="logistic_regression":
        return lr_model
    return xgb_model

def distance_km(lat1,lon1,lat2,lon2):
    r=6371
    dlat=radians(float(lat2)-float(lat1))
    dlon=radians(float(lon2)-float(lon1))
    a=sin(dlat/2)**2+cos(radians(float(lat1)))*cos(radians(float(lat2)))*sin(dlon/2)**2
    return r*2*atan2(sqrt(a),sqrt(1-a))

# =========================
# PAGES
# =========================

@app.route("/")
@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/detect")
def detect():
    return render_template("detect.html")

@app.route("/transactions")
def transactions():
    return render_template("transactions.html")

@app.route("/analytics")
def analytics():
    return render_template("analytics.html")

@app.route("/test-db")
def test_db():
    conn=get_db_connection()
    if conn:
        conn.close()
        return "Database connected successfully!"
    return "Database connection failed!"

# =========================
# CUSTOMERS
# =========================

@app.route("/api/customers")
def customers():

    conn=get_db_connection()

    if not conn:
        return jsonify({
            "success":False,
            "message":"Database connection failed."
        }),500

    cur=conn.cursor(dictionary=True)

    try:
        cur.execute("""
            SELECT
                customer_id,
                name,
                date_of_birth,
                gender,
                job,
                city,
                state,
                zip_code,
                latitude,
                longitude,
                city_population
            FROM customer
            ORDER BY customer_id
        """)

        customers=cur.fetchall()

        for c in customers:
            if c.get("date_of_birth"):
                c["date_of_birth"]=str(c["date_of_birth"])

        return jsonify({
            "success":True,
            "customers":customers
        })

    except Exception as e:
        return jsonify({
            "success":False,
            "message":str(e)
        }),500

    finally:
        cur.close()
        conn.close()

# =========================
# ACCOUNTS
# =========================

@app.route("/api/accounts")
def accounts():
    conn=get_db_connection()
    if not conn:
        return jsonify({"success":False,"message":"Database connection failed."}),500

    cur=conn.cursor(dictionary=True)
    try:
        cid=request.args.get("customer_id")

        if cid:
            cur.execute("""
                SELECT account_id,customer_id,account_number,account_type
                FROM account
                WHERE customer_id=%s
                ORDER BY account_id
            """,(cid,))
        else:
            cur.execute("""
                SELECT account_id,customer_id,account_number,account_type
                FROM account
                ORDER BY account_id
            """)

        return jsonify({"success":True,"accounts":cur.fetchall()})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}),500
    finally:
        cur.close()
        conn.close()

# =========================
# DEVICES
# =========================

@app.route("/api/devices")
def devices():
    conn=get_db_connection()
    if not conn:
        return jsonify({"success":False,"message":"Database connection failed."}),500

    cur=conn.cursor(dictionary=True)
    try:
        cur.execute("""
            SELECT device_id,device_type,device_name
            FROM device
            ORDER BY device_id
        """)
        return jsonify({"success":True,"devices":cur.fetchall()})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}),500
    finally:
        cur.close()
        conn.close()

# =========================
# MERCHANTS
# =========================

@app.route("/api/merchants")
def merchants():
    conn=get_db_connection()
    if not conn:
        return jsonify({"success":False,"message":"Database connection failed."}),500

    cur=conn.cursor(dictionary=True)
    try:
        cur.execute("""
            SELECT merchant_id,merchant_name,category,location,
                   latitude,longitude
            FROM merchant
            ORDER BY merchant_name
        """)
        return jsonify({"success":True,"merchants":cur.fetchall()})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}),500
    finally:
        cur.close()
        conn.close()

# =========================
# PREDICTION
# =========================

@app.route("/predict",methods=["POST"])
def predict():
    conn=None
    cursor=None

    try:
        data=request.get_json(silent=True) or request.form.to_dict()

        customer_type=str(data.get("customer_type","existing")).lower()

        try:
            customer_id=int(data.get("customer_id",0) or 0)
        except (ValueError,TypeError):
            customer_id=0

        amount=float(data.get("amount",0))

        transaction_type=str(
            data.get("transaction_type","")
        ).strip()

        transaction_time=pd.to_datetime(
            data.get("transaction_time") or datetime.now()
        )

        # =========================
        # AGE
        # =========================

        dob_value=str(data.get("dob","")).strip()

        if dob_value:
            dob=pd.to_datetime(dob_value,errors="coerce")

            if pd.isna(dob):
                raise ValueError("Invalid date of birth.")

            transaction_date=pd.Timestamp(transaction_time).normalize()
            dob_date=pd.Timestamp(dob).normalize()

            if dob_date>transaction_date:
                raise ValueError(
                    "Date of birth cannot be after transaction date."
                )

            age=(
                transaction_date.year-dob_date.year-
                (
                    (transaction_date.month,transaction_date.day)<
                    (dob_date.month,dob_date.day)
                )
            )
        else:
            age=int(data.get("age",0))

        gender=str(data.get("gender","")).strip()
        job=str(data.get("job","")).strip()
        state=str(data.get("state","")).strip()
        city=str(data.get("city","")).strip()

        try:
            merchant_id=int(data.get("merchant_id",0) or 0)
        except (ValueError,TypeError):
            merchant_id=0

        # Account/device are optional from UI now
        try:
            account_id=int(data.get("account_id",0) or 0)
        except (ValueError,TypeError):
            account_id=0

        try:
            device_id=int(data.get("device_id",0) or 0)
        except (ValueError,TypeError):
            device_id=0

        model_name=str(
            data.get("model","xgboost")
        ).lower()

        # =========================
        # VALIDATION
        # =========================

        if amount<=0:
            raise ValueError("Amount must be greater than 0.")

        if not transaction_type:
            raise ValueError("Transaction type is required.")

        if age<18 or age>120:
            raise ValueError("Customer must be 18 years or above.")

        if not gender or not job or not state or not city:
            raise ValueError(
                "Gender, job, state and city are required."
            )

        if merchant_id<=0:
            raise ValueError("Please select a merchant.")

        model=get_model(model_name)

        conn=get_db_connection()

        if not conn:
            raise RuntimeError("Database connection failed.")

        cursor=conn.cursor(dictionary=True)

        # =========================
        # MERCHANT
        # =========================

        cursor.execute("""
            SELECT merchant_id,merchant_name,category,location,
                   latitude,longitude
            FROM merchant
            WHERE merchant_id=%s
        """,(merchant_id,))

        merchant_data=cursor.fetchone()

        if not merchant_data:
            raise ValueError("Selected merchant not found.")

        merchant=merchant_data["merchant_name"]
        category=merchant_data["category"]
        merchant_lat=merchant_data["latitude"]
        merchant_long=merchant_data["longitude"]

        if merchant_lat is None or merchant_long is None:
            raise ValueError("Merchant coordinates are missing.")

        # =========================
        # CUSTOMER LOCATION
        # =========================

        customer=None

        if customer_type=="existing":

            if customer_id<=0:
                raise ValueError(
                    "Please select an existing customer."
                )

            cursor.execute("""
                SELECT customer_id,zip_code,latitude,longitude,
                       city_population
                FROM customer
                WHERE customer_id=%s
            """,(customer_id,))

            customer=cursor.fetchone()

            if not customer:
                raise ValueError(
                    "Selected customer not found."
                )

        else:

            new_zip=data.get("zip_code")
            new_lat=data.get("latitude")
            new_long=data.get("longitude")
            new_city_pop=data.get("city_population")

            if not any(
                v in [None,""]
                for v in [
                    new_zip,
                    new_lat,
                    new_long,
                    new_city_pop
                ]
            ):
                zip_code=new_zip
                customer_lat=float(new_lat)
                customer_long=float(new_long)
                city_pop=float(new_city_pop)

            else:
                cursor.execute("""
                    SELECT zip_code,latitude,longitude,
                           city_population
                    FROM customer
                    WHERE LOWER(TRIM(city))=LOWER(TRIM(%s))
                    AND LOWER(TRIM(state))=LOWER(TRIM(%s))
                    ORDER BY customer_id
                    LIMIT 1
                """,(city,state))

                customer=cursor.fetchone()

                if not customer:
                    raise ValueError(
                        "Location data for this new customer's city "
                        "is not available. Please provide zip, "
                        "latitude, longitude and city population."
                    )

                zip_code=customer["zip_code"]
                customer_lat=customer["latitude"]
                customer_long=customer["longitude"]
                city_pop=customer["city_population"]

        if customer_type=="existing":
            zip_code=customer["zip_code"]
            customer_lat=customer["latitude"]
            customer_long=customer["longitude"]
            city_pop=customer["city_population"]

        if (
            zip_code is None or
            customer_lat is None or
            customer_long is None or
            city_pop is None
        ):
            raise ValueError(
                "Customer location data is incomplete."
            )

        # =========================
        # FEATURE ENGINEERING
        # =========================

        hour=transaction_time.hour
        day_of_week=transaction_time.dayofweek
        month=transaction_time.month

        is_weekend=int(day_of_week>=5)
        is_night=int(hour<6 or hour>=22)

        customer_age=age
        log_amt=np.log1p(amount)

        dist=distance_km(
            customer_lat,
            customer_long,
            merchant_lat,
            merchant_long
        )

        unix_time=int(transaction_time.timestamp())

        # =========================
        # INPUT DATAFRAME
        # =========================

        df=pd.DataFrame({
            "category":[category],
            "gender":[gender],
            "state":[state],
            "city":[city],
            "job":[job],
            "merchant":[merchant],
            "amt":[amount],
            "zip":[zip_code],
            "lat":[customer_lat],
            "long":[customer_long],
            "city_pop":[city_pop],
            "unix_time":[unix_time],
            "merch_lat":[merchant_lat],
            "merch_long":[merchant_long],
            "hour":[hour],
            "day_of_week":[day_of_week],
            "month":[month],
            "is_weekend":[is_weekend],
            "is_night":[is_night],
            "customer_age":[customer_age],
            "log_amt":[log_amt],
            "distance_km":[dist]
        })

        # =========================
        # ENCODING
        # =========================

        encoded=ohe.transform(
            df[["category","gender","state"]]
        )

        target_encoded=target_encoder.transform(
            df[["city","job","merchant"]]
        )

        if hasattr(target_encoded,"values"):
            target_encoded=target_encoded.values

        numeric=df[
            [
                "amt",
                "zip",
                "lat",
                "long",
                "city_pop",
                "unix_time",
                "merch_lat",
                "merch_long",
                "hour",
                "day_of_week",
                "month",
                "is_weekend",
                "is_night",
                "customer_age",
                "log_amt",
                "distance_km"
            ]
        ].values

        X=np.hstack([
            numeric,
            np.asarray(encoded),
            np.asarray(target_encoded)
        ])

        # =========================
        # MODEL SAFETY CHECK
        # =========================

        if hasattr(model,"n_features_in_"):
            if X.shape[1]!=model.n_features_in_:
                raise ValueError(
                    f"Feature mismatch: model expects "
                    f"{model.n_features_in_}, received "
                    f"{X.shape[1]}"
                )

        # =========================
        # PREDICTION
        # =========================

        prediction=int(
            model.predict(X)[0]
        )

        probability=float(
            model.predict_proba(X)[0][1]
        )

        probability_percent=round(
            probability*100,
            2
        )

        if prediction==1:
            result="FRAUD"
            risk="HIGH"
            message=(
                "This transaction has been detected "
                "as potentially fraudulent."
            )
        else:
            result="GENUINE"
            risk="LOW"
            message=(
                "This transaction appears to be genuine."
            )

        # =========================
        # SAVE TRANSACTION
        # FIXED FOR BOTH CUSTOMERS
        # =========================

        transaction_saved=False
        transaction_id=None

        # If account selected, use it.
        # Otherwise use first available account.
        save_account_id=account_id if account_id>0 else None

        if not save_account_id:
            cursor.execute("""
                SELECT account_id
                FROM account
                ORDER BY account_id
                LIMIT 1
            """)
            row=cursor.fetchone()

            if row:
                save_account_id=row["account_id"]

        # Device is no longer required from UI.
        # If not selected, use first available device.
        save_device_id=device_id if device_id>0 else None

        if not save_device_id:
            cursor.execute("""
                SELECT device_id
                FROM device
                ORDER BY device_id
                LIMIT 1
            """)
            row=cursor.fetchone()

            if row:
                save_device_id=row["device_id"]

        if not save_account_id:
            raise ValueError(
                "No account available to save transaction."
            )

        if not save_device_id:
            raise ValueError(
                "No device available to save transaction."
            )

        # Validate account
        cursor.execute(
            "SELECT account_id FROM account WHERE account_id=%s",
            (save_account_id,)
        )
        account=cursor.fetchone()

        if not account:
            raise ValueError(
                "Selected account not found."
            )

        # Validate device
        cursor.execute(
            "SELECT device_id FROM device WHERE device_id=%s",
            (save_device_id,)
        )
        device=cursor.fetchone()

        if not device:
            raise ValueError(
                "Selected device not found."
            )

        # SAVE TRANSACTION
        cursor.execute("""
            INSERT INTO `transaction`
            (
                account_id,
                merchant_id,
                device_id,
                amount,
                transaction_type,
                transaction_time,
                location,
                status,
                merchant_category,
                fraud_probability,
                risk_level
            )
            VALUES
            (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,(
            save_account_id,
            merchant_id,
            save_device_id,
            amount,
            transaction_type,
            transaction_time.to_pydatetime(),
            city,
            result,
            category,
            probability_percent,
            risk
        ))

        transaction_id=cursor.lastrowid
        transaction_saved=True

        conn.commit()

        # =========================
        # RESPONSE
        # =========================

        return jsonify({
            "success":True,
            "transaction_id":transaction_id,
            "transaction_saved":transaction_saved,
            "customer_type":customer_type,
            "prediction":result,
            "probability":probability_percent,
            "fraud_probability":probability,
            "fraud_probability_percent":probability_percent,
            "risk_level":risk,
            "model":model_name,
            "message":message
        })

    except Exception as e:

        if conn:
            conn.rollback()

        print("Prediction Error:",e)

        return jsonify({
            "success":False,
            "message":str(e)
        }),400

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()

# =========================
# TRANSACTIONS
# =========================

@app.route("/api/transactions")
def get_transactions():

    conn=get_db_connection()

    if not conn:
        return jsonify({
            "success":False,
            "message":"Database connection failed."
        }),500

    cursor=conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                t.transaction_id,
                t.amount,
                t.transaction_type,
                t.transaction_time,
                t.location,
                t.status,
                t.merchant_category,
                t.fraud_probability,
                t.risk_level,
                m.merchant_name
            FROM `transaction` t
            LEFT JOIN merchant m
                ON t.merchant_id=m.merchant_id
            ORDER BY t.transaction_id DESC
            LIMIT 100
        """)

        rows=cursor.fetchall()

        for row in rows:

            if row["amount"] is not None:
                row["amount"]=float(row["amount"])

            if row["fraud_probability"] is not None:
                row["fraud_probability"]=float(
                    row["fraud_probability"]
                )

            row["location"]=row["location"] or "-"
            row["merchant_category"]=row["merchant_category"] or "-"
            row["merchant_name"]=row["merchant_name"] or "-"

            if row["transaction_time"]:
                row["transaction_time"]=str(
                    row["transaction_time"]
                )

        return jsonify({
            "success":True,
            "transactions":rows
        })

    except Exception as e:

        return jsonify({
            "success":False,
            "message":str(e)
        }),500

    finally:

        cursor.close()
        conn.close()

# =========================
# DELETE TRANSACTION
# =========================

@app.route(
    "/api/transactions/<int:transaction_id>",
    methods=["DELETE"]
)
def delete_transaction(transaction_id):

    conn=get_db_connection()

    if not conn:
        return jsonify({
            "success":False,
            "message":"Database connection failed."
        }),500

    cursor=conn.cursor()

    try:

        cursor.execute("""
            DELETE FROM `transaction`
            WHERE transaction_id=%s
        """,(transaction_id,))

        if cursor.rowcount==0:

            conn.rollback()

            return jsonify({
                "success":False,
                "message":"Transaction not found."
            }),404

        conn.commit()

        return jsonify({
            "success":True,
            "message":"Transaction deleted successfully."
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success":False,
            "message":str(e)
        }),500

    finally:

        cursor.close()
        conn.close()

# =========================
# STATS
# =========================

@app.route("/stats")
def stats():

    conn = get_db_connection()

    if not conn:
        return jsonify({
            "success": False,
            "message": "Database connection failed."
        }), 500

    cursor = conn.cursor(dictionary=True)

    try:

        # =========================
        # TRANSACTION STATISTICS
        # =========================

        cursor.execute("""
            SELECT
                COUNT(*) AS total_transactions,

                SUM(
                    CASE
                        WHEN status = 'FRAUD'
                        THEN 1 ELSE 0
                    END
                ) AS fraud_transactions,

                SUM(
                    CASE
                        WHEN status = 'GENUINE'
                        THEN 1 ELSE 0
                    END
                ) AS genuine_transactions,

                COALESCE(SUM(amount), 0) AS total_value,

                COALESCE(AVG(amount), 0) AS average_amount,

                SUM(
                    CASE
                        WHEN risk_level = 'HIGH'
                        THEN 1 ELSE 0
                    END
                ) AS high_risk,

                SUM(
                    CASE
                        WHEN DATE(transaction_time) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS today_transactions

            FROM `transaction`
        """)

        data = cursor.fetchone()

        total = int(data["total_transactions"] or 0)

        fraud = int(data["fraud_transactions"] or 0)

        genuine = int(data["genuine_transactions"] or 0)


        # =========================
        # TOTAL MERCHANTS
        # =========================

        cursor.execute("""
            SELECT COUNT(DISTINCT merchant_id) AS total_merchants
            FROM `transaction`
            WHERE merchant_id IS NOT NULL
        """)

        merchant_data = cursor.fetchone()

        total_merchants = int(
            merchant_data["total_merchants"] or 0
        )

        # =========================
        # TOTAL CUSTOMERS
        # =========================

        cursor.execute("""
            SELECT COUNT(DISTINCT a.customer_id) AS total_customers
            FROM `transaction` t
            INNER JOIN account a
                ON t.account_id = a.account_id
            WHERE a.customer_id IS NOT NULL
        """)

        customer_data = cursor.fetchone()

        total_customers = int(
            customer_data["total_customers"] or 0
        )


        # =========================
        # RESPONSE
        # =========================

        return jsonify({

            "success": True,

            "total_transactions": total,

            "fraud_transactions": fraud,

            "genuine_transactions": genuine,

            "fraud_rate": round(
                fraud / total * 100, 2
            ) if total else 0,

            "total_value": float(
                data["total_value"] or 0
            ),

            "average_amount": float(
                data["average_amount"] or 0
            ),

            "high_risk": int(
                data["high_risk"] or 0
            ),

            "today_transactions": int(
                data["today_transactions"] or 0
            ),

            "total_merchants": total_merchants,

            "total_customers": total_customers,

            # aliases used by frontend
            "total": total,
            "fraud": fraud,
            "genuine": genuine
        })

    except Exception as e:

        print("Stats Error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()
# =========================
# ANALYTICS
# =========================

@app.route("/api/analytics")
def analytics_api():

    conn=get_db_connection()

    if not conn:
        return jsonify({
            "success":False,
            "message":"Database connection failed."
        }),500

    cursor=conn.cursor(dictionary=True)

    try:

        # =========================
        # SUMMARY
        # =========================

        cursor.execute("""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status='FRAUD' THEN 1 ELSE 0 END) AS fraud,
                SUM(CASE WHEN status='GENUINE' THEN 1 ELSE 0 END) AS genuine,
                COALESCE(SUM(amount),0) AS total_amount,
                COALESCE(AVG(amount),0) AS average_amount,
                COALESCE(MAX(amount),0) AS highest_amount,
                COALESCE(AVG(fraud_probability),0) AS average_probability
            FROM `transaction`
        """)

        data=cursor.fetchone()

        total=int(data["total"] or 0)
        fraud=int(data["fraud"] or 0)
        genuine=int(data["genuine"] or 0)

        # =========================
        # RISK
        # =========================

        cursor.execute("""
            SELECT
                risk_level AS label,
                COUNT(*) AS count
            FROM `transaction`
            GROUP BY risk_level
        """)

        risk_levels=cursor.fetchall()

        # =========================
        # TRANSACTION TYPE
        # =========================

        cursor.execute("""
            SELECT
                transaction_type AS label,
                COUNT(*) AS count
            FROM `transaction`
            WHERE transaction_type IS NOT NULL
            GROUP BY transaction_type
            ORDER BY count DESC
        """)

        transaction_types=cursor.fetchall()

        # =========================
        # MERCHANT
        # =========================

        cursor.execute("""
            SELECT
                COALESCE(m.merchant_name,'Unknown') AS label,
                COUNT(*) AS count
            FROM `transaction` t
            LEFT JOIN merchant m
                ON t.merchant_id=m.merchant_id
            GROUP BY m.merchant_name
            ORDER BY count DESC
        """)

        merchants=cursor.fetchall()

        # =========================
        # LOCATION
        # =========================

        cursor.execute("""
            SELECT
                COALESCE(location,'Unknown') AS label,
                COUNT(*) AS count
            FROM `transaction`
            GROUP BY location
            ORDER BY count DESC
        """)

        locations=cursor.fetchall()

        # =========================
        # AMOUNT / TIME
        # =========================

        cursor.execute("""
            SELECT
                transaction_time AS label,
                amount AS value
            FROM `transaction`
            ORDER BY transaction_id ASC
            LIMIT 50
        """)

        amounts=cursor.fetchall()

        for row in amounts:
            if row["label"]:
                row["label"]=str(row["label"])

            row["value"]=float(row["value"] or 0)

        # =========================
        # RESPONSE
        # =========================

        return jsonify({
            "success":True,

            "total":total,
            "fraud":fraud,
            "genuine":genuine,

            "fraud_rate":round(
                fraud/total*100,2
            ) if total else 0,

            "amount":float(
                data["total_amount"] or 0
            ),

            "total_amount":float(
                data["total_amount"] or 0
            ),

            "average_amount":float(
                data["average_amount"] or 0
            ),

            "highest_amount":float(
                data["highest_amount"] or 0
            ),

            "average_probability":float(
                data["average_probability"] or 0
            ),

            "risk_levels":risk_levels,

            "transaction_types":transaction_types,

            "merchants":merchants,

            "locations":locations,

            "amounts":amounts
        })

    except Exception as e:

        print("Analytics Error:",e)

        return jsonify({
            "success":False,
            "message":str(e)
        }),500

    finally:

        cursor.close()
        conn.close()

# =========================
# RUN
# =========================

if __name__=="__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )