import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, TargetEncoder
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    roc_auc_score,
    average_precision_score
)

from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.model_selection import RandomizedSearchCV

# =========================================================
# 1. LOAD DATA
# =========================================================

train = pd.read_csv(
    r"C:\Users\SHANTANU\OneDrive\Documents\java\PREDICTIN_CCARD\fraudTrain.csv"
)

test = pd.read_csv(
    r"C:\Users\SHANTANU\OneDrive\Documents\java\PREDICTIN_CCARD\fraudTest.csv"
)

# =========================================================
# 2. REMOVE UNNECESSARY INDEX
# =========================================================

train = train.drop(columns=["Unnamed: 0"], errors="ignore")
test = test.drop(columns=["Unnamed: 0"], errors="ignore")

# =========================================================
# 3. FEATURE ENGINEERING
# =========================================================

# Convert date/time
train["trans_date_trans_time"] = pd.to_datetime(
    train["trans_date_trans_time"]
)

test["trans_date_trans_time"] = pd.to_datetime(
    test["trans_date_trans_time"]
)

# Convert DOB
train["dob"] = pd.to_datetime(train["dob"])
test["dob"] = pd.to_datetime(test["dob"])

# Hour
train["hour"] = train["trans_date_trans_time"].dt.hour
test["hour"] = test["trans_date_trans_time"].dt.hour

# Day of week
train["day_of_week"] = (
    train["trans_date_trans_time"].dt.dayofweek
)

test["day_of_week"] = (
    test["trans_date_trans_time"].dt.dayofweek
)

# Month
train["month"] = (
    train["trans_date_trans_time"].dt.month
)

test["month"] = (
    test["trans_date_trans_time"].dt.month
)

# Weekend
train["is_weekend"] = (
    train["day_of_week"] >= 5
).astype(int)

test["is_weekend"] = (
    test["day_of_week"] >= 5
).astype(int)

# Night
train["is_night"] = (
    (train["hour"] < 6) |
    (train["hour"] >= 22)
).astype(int)

test["is_night"] = (
    (test["hour"] < 6) |
    (test["hour"] >= 22)
).astype(int)

# Customer age
train["customer_age"] = (
    train["trans_date_trans_time"].dt.year
    - train["dob"].dt.year
)

test["customer_age"] = (
    test["trans_date_trans_time"].dt.year
    - test["dob"].dt.year
)

# Log transaction amount
train["log_amt"] = np.log1p(train["amt"])
test["log_amt"] = np.log1p(test["amt"])

# =========================================================
# 4. DISTANCE BETWEEN CUSTOMER AND MERCHANT
# =========================================================

def calculate_distance(lat1, lon1, lat2, lon2):

    R = 6371

    lat1 = np.radians(lat1)
    lon1 = np.radians(lon1)

    lat2 = np.radians(lat2)
    lon2 = np.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        np.sin(dlat / 2) ** 2
        +
        np.cos(lat1)
        * np.cos(lat2)
        * np.sin(dlon / 2) ** 2
    )

    c = 2 * np.arctan2(
        np.sqrt(a),
        np.sqrt(1 - a)
    )

    return R * c


train["distance_km"] = calculate_distance(
    train["lat"],
    train["long"],
    train["merch_lat"],
    train["merch_long"]
)

test["distance_km"] = calculate_distance(
    test["lat"],
    test["long"],
    test["merch_lat"],
    test["merch_long"]
)

# =========================================================
# 5. SEPARATE FEATURES AND TARGET
# =========================================================

y = train["is_fraud"]

drop_cols = [
    "is_fraud",
    "trans_date_trans_time",
    "first",
    "last",
    "street",
    "trans_num",
    "cc_num",
    "dob"
]

X = train.drop(columns=drop_cols)

# =========================================================
# 6. TRAIN / VALIDATION SPLIT
# =========================================================

x_train, x_val, y_train, y_val = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

# =========================================================
# 7. ONE-HOT ENCODING
# =========================================================

one_hot_cols = [
    "category",
    "gender",
    "state"
]

ohe = OneHotEncoder(
    handle_unknown="ignore",
    sparse_output=False
)

ohe.fit(
    x_train[one_hot_cols]
)

X_train_encoded = ohe.transform(
    x_train[one_hot_cols]
)

X_val_encoded = ohe.transform(
    x_val[one_hot_cols]
)

# =========================================================
# 8. TARGET ENCODING
# =========================================================

target_cols = [
    "city",
    "job",
    "merchant"
]

tg = TargetEncoder(
    smooth="auto",
    random_state=42
)

tg.fit(
    x_train[target_cols],
    y_train
)

x_train_tg = tg.transform(
    x_train[target_cols]
)

x_val_tg = tg.transform(
    x_val[target_cols]
)

# =========================================================
# 9. NUMERICAL FEATURES
# =========================================================

numeric_cols = [
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

x_train_num = x_train[numeric_cols].copy()
x_val_num = x_val[numeric_cols].copy()

# =========================================================
# 10. COMBINE ALL FEATURES
# =========================================================

x_train_final = np.hstack([
    x_train_num.values,
    X_train_encoded,
    x_train_tg
])

x_val_final = np.hstack([
    x_val_num.values,
    X_val_encoded,
    x_val_tg
])

# =========================================================
# 11. RANDOM FOREST
# =========================================================

rf_model = RandomForestClassifier(
    n_estimators=100,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

rf_model.fit(
    x_train_final,
    y_train
)

y_pred_rf = rf_model.predict(x_val_final)

y_prob_rf = rf_model.predict_proba(
    x_val_final
)[:, 1]


print("\nConfusion Matrix:")
print(confusion_matrix(y_val, y_pred_rf))

print("\nClassification Report:")
print(classification_report(y_val, y_pred_rf))

print(
    "ROC-AUC:",
    roc_auc_score(y_val, y_prob_rf)
)

print(
    "PR-AUC:",
    average_precision_score(y_val, y_prob_rf)
)

# =========================================================
# 12. LOGISTIC REGRESSION
# =========================================================

lr = LogisticRegression(
    max_iter=1000,
    class_weight="balanced",
    random_state=42
)

lr.fit(
    x_train_final,
    y_train
)

lr_pred = lr.predict(x_val_final)

lr_pred_prob = lr.predict_proba(
    x_val_final
)[:, 1]


print("\nClassification Report:")
print(classification_report(y_val, lr_pred))

print(
    "ROC-AUC:",
    roc_auc_score(y_val, lr_pred_prob)
)

print(
    "PR-AUC:",
    average_precision_score(y_val, lr_pred_prob)
)

# =========================================================
# 13. XGBOOST BASELINE
# =========================================================

xgb = XGBClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=6,
    random_state=42,
    eval_metric="logloss",
    n_jobs=-1
)

xgb.fit(
    x_train_final,
    y_train
)

xgb_pred = xgb.predict(x_val_final)

xgb_prob = xgb.predict_proba(
    x_val_final
)[:, 1]


print("\nConfusion Matrix:")
print(confusion_matrix(y_val, xgb_pred))

print("\nClassification Report:")
print(classification_report(y_val, xgb_pred))

print(
    "ROC-AUC:",
    roc_auc_score(y_val, xgb_prob)
)

print(
    "PR-AUC:",
    average_precision_score(y_val, xgb_prob)
)

# =========================================================
# 14. XGBOOST HYPERPARAMETER TUNING
# =========================================================

xgb_tuning = XGBClassifier(
    random_state=42,
    eval_metric="logloss",
    n_jobs=-1
)

param_grid = {

    "n_estimators": [
        100,
        200,
        300
    ],

    "max_depth": [
        3,
        5,
        7
    ],

    "learning_rate": [
        0.01,
        0.05,
        0.1
    ],

    "subsample": [
        0.8,
        1.0
    ],

    "colsample_bytree": [
        0.8,
        1.0
    ]
}

random_search = RandomizedSearchCV(
    estimator=xgb_tuning,
    param_distributions=param_grid,
    n_iter=10,
    scoring="average_precision",
    cv=3,
    random_state=42,
    n_jobs=-1,
    verbose=1
)

random_search.fit(
    x_train_final,
    y_train
)


print("\nBest Parameters:")
print(random_search.best_params_)

print("\nBest CV PR-AUC:")
print(random_search.best_score_)

# =========================================================
# 15. BEST XGBOOST MODEL
# =========================================================

best_xgb = random_search.best_estimator_

y_pred_best_xgb = best_xgb.predict(
    x_val_final
)

y_prob_best_xgb = best_xgb.predict_proba(
    x_val_final
)[:, 1]

print("\n================ TUNED XGBOOST ================")

print("\nConfusion Matrix:")
print(
    confusion_matrix(
        y_val,
        y_pred_best_xgb
    )
)

print("\nClassification Report:")
print(
    classification_report(
        y_val,
        y_pred_best_xgb
    )
)

print(
    "ROC-AUC:",
    roc_auc_score(
        y_val,
        y_prob_best_xgb
    )
)

print(
    "PR-AUC:",
    average_precision_score(
        y_val,
        y_prob_best_xgb
    )
)

# =========================================================
# 16. SAVE FINAL MODEL
# =========================================================

import joblib
import os

os.makedirs(
    "models",
    exist_ok=True
)

# Save final XGBoost model
joblib.dump(
    best_xgb,
    "models/final_xgboost.pkl"
)

# Save encoders
joblib.dump(
    ohe,
    "models/one_hot_encoder.pkl"
)

joblib.dump(
    tg,
    "models/target_encoder.pkl"
)

print(
    "\nFinal XGBoost model and encoders "
    "saved successfully."
)
joblib.dump(rf_model, "models/random_forest.pkl")
joblib.dump(lr, "models/logistic_regression.pkl")