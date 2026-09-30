import pandas as pd
import numpy as np
import json, joblib, os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, roc_auc_score,
                             roc_curve)
from imblearn.over_sampling import SMOTE

CSV = "credit_card_fraud_dataset.csv"

def build_stats_and_train(df):
    df = df.copy()
    df["TransactionDate"] = pd.to_datetime(df["TransactionDate"])
    df["Hour"]      = df["TransactionDate"].dt.hour
    df["Month"]     = df["TransactionDate"].dt.month
    df["DayOfWeek"] = df["TransactionDate"].dt.dayofweek

    le_type = LabelEncoder()
    le_loc  = LabelEncoder()
    df["TransactionType_enc"] = le_type.fit_transform(df["TransactionType"])
    df["Location_enc"]        = le_loc.fit_transform(df["Location"])

    features = ["Amount", "MerchantID", "TransactionType_enc", "Location_enc",
                "Hour", "Month", "DayOfWeek"]
    X = df[features].values
    y = df["IsFraud"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    sm = SMOTE(random_state=42)
    X_res, y_res = sm.fit_resample(X_train, y_train)

    scaler = StandardScaler()
    X_res_sc  = scaler.fit_transform(X_res)
    X_test_sc = scaler.transform(X_test)

    model_defs = {
        "logistic_regression": LogisticRegression(max_iter=1000, random_state=42),
        "decision_tree":       DecisionTreeClassifier(max_depth=8, random_state=42),
        "random_forest":       RandomForestClassifier(n_estimators=100, max_depth=10,
                                                      random_state=42, n_jobs=-1),
    }

    results = {}
    os.makedirs("models", exist_ok=True)

    for key, clf in model_defs.items():
        clf.fit(X_res_sc, y_res)
        y_pred = clf.predict(X_test_sc)
        y_prob = clf.predict_proba(X_test_sc)[:, 1]
        cm = confusion_matrix(y_test, y_pred).tolist()

        # ROC curve (sampled to 50 points for JSON size)
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        step = max(1, len(fpr) // 50)
        roc_data = {"fpr": [round(float(v),4) for v in fpr[::step]],
                    "tpr": [round(float(v),4) for v in tpr[::step]]}

        # Feature importance
        if hasattr(clf, "feature_importances_"):
            fi = [round(float(v), 4) for v in clf.feature_importances_]
        else:
            fi = [round(float(abs(v)), 4) for v in clf.coef_[0]]

        results[key] = {
            "accuracy":  round(accuracy_score(y_test, y_pred) * 100, 2),
            "precision": round(precision_score(y_test, y_pred, zero_division=0) * 100, 2),
            "recall":    round(recall_score(y_test, y_pred, zero_division=0) * 100, 2),
            "f1":        round(f1_score(y_test, y_pred, zero_division=0) * 100, 2),
            "roc_auc":   round(roc_auc_score(y_test, y_prob) * 100, 2),
            "confusion_matrix": cm,
            "roc_curve": roc_data,
            "feature_importance": fi,
        }
        joblib.dump(clf, f"models/{key}.pkl")
        print(f"{key}: Acc={results[key]['accuracy']}%  "
              f"Recall={results[key]['recall']}%  AUC={results[key]['roc_auc']}%")

    joblib.dump(scaler,  "models/scaler.pkl")
    joblib.dump(le_type, "models/le_type.pkl")
    joblib.dump(le_loc,  "models/le_loc.pkl")

    # ── Dataset analytics ────────────────────────────────────────────────────
    fbt = df.groupby(["TransactionType", "IsFraud"]).size().unstack(fill_value=0)
    fraud_by_loc = df[df["IsFraud"]==1]["Location"].value_counts().head(10).to_dict()

    # Amount buckets (5 equal-width bins, clean labels)
    df["AmtBin"] = pd.cut(df["Amount"], bins=5,
                          labels=["Rs. 1-Rs. 1,000","Rs. 1,001-Rs. 2,000","Rs. 2,001-Rs. 3,000","Rs. 3,001-Rs. 4,000","Rs. 4,001-Rs. 5,000"])
    amt_grp = df.groupby("AmtBin", observed=True)["IsFraud"].agg(["sum","count"]).reset_index()

    # Fraud by month
    fraud_by_month = df[df["IsFraud"]==1]["Month"].value_counts().sort_index().to_dict()

    # Merchant risk: top 10 merchants by fraud count
    merchant_risk = (df[df["IsFraud"]==1]["MerchantID"]
                     .value_counts().head(10).to_dict())

    stats = {
        "total": int(len(df)),
        "fraud": int(df["IsFraud"].sum()),
        "legit": int((df["IsFraud"]==0).sum()),
        "fraud_pct": round(df["IsFraud"].mean() * 100, 2),
        "avg_fraud_amount": round(df[df["IsFraud"]==1]["Amount"].mean(), 2),
        "avg_legit_amount": round(df[df["IsFraud"]==0]["Amount"].mean(), 2),
        "fraud_by_type": {
            t: {"fraud": int(fbt.loc[t, 1]) if 1 in fbt.columns else 0,
                "legit": int(fbt.loc[t, 0]) if 0 in fbt.columns else 0}
            for t in fbt.index
        },
        "fraud_by_location": {str(k): int(v) for k, v in fraud_by_loc.items()},
        "amount_distribution": {
            "labels": amt_grp["AmtBin"].astype(str).tolist(),
            "fraud":  [int(v) for v in amt_grp["sum"].tolist()],
            "total":  [int(v) for v in amt_grp["count"].tolist()],
        },
        "fraud_by_hour":  {str(k): int(v) for k, v in
                           df[df["IsFraud"]==1]["Hour"].value_counts().sort_index().items()},
        "fraud_by_month": {str(k): int(v) for k, v in fraud_by_month.items()},
        "merchant_risk":  {str(k): int(v) for k, v in merchant_risk.items()},
        "model_results":  results,
        "features":       features,
        "transaction_types": le_type.classes_.tolist(),
        "locations":         le_loc.classes_.tolist(),
        "merchant_ids":      sorted(df["MerchantID"].unique().tolist()),
    }

    with open("models/stats.json", "w") as f:
        json.dump(stats, f, indent=2)

    print("Training complete. All models and stats saved.")
    return stats

if __name__ == "__main__":
    df = pd.read_csv(CSV)
    build_stats_and_train(df)

   