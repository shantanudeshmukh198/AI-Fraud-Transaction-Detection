\# 🛡️ AI-Based Fraud Transaction Detection \& Analytics System



An intelligent Machine Learning based web application designed to detect potentially fraudulent financial transactions and provide detailed transaction analytics.



The system combines \*\*Machine Learning, Flask, MySQL and a web-based interface\*\* to provide fraud prediction, transaction management and analytical insights.



\---



\## 📌 Project Overview



Financial fraud is a major challenge in modern digital transactions. This project uses Machine Learning techniques to analyze transaction-related features and classify transactions as:



\- ✅ Genuine Transaction

\- 🚨 Fraudulent Transaction



The application allows users to enter transaction details, select a Machine Learning model and receive a fraud prediction along with the prediction probability.



\---



\## 🎯 Objectives



\- Detect potentially fraudulent transactions using Machine Learning.

\- Provide a simple and user-friendly fraud detection interface.

\- Store and manage transaction-related information using MySQL.

\- Provide transaction history and analytics.

\- Compare multiple Machine Learning algorithms.

\- Provide fraud probability along with the prediction result.



\---



\## ✨ Key Features



\### 🔍 Fraud Detection

\- Transaction fraud prediction using trained ML models.

\- Fraud/Genuine classification.

\- Prediction probability.

\- Support for multiple ML algorithms.



\### 👤 Customer Management

\- Existing customer selection.

\- New customer transaction prediction.

\- Automatic retrieval of customer information.

\- Customer-related transaction details.



\### 💳 Transaction Processing

\- Transaction amount.

\- Transaction type.

\- Merchant selection.

\- Transaction time.

\- International transaction detection.

\- New device detection.



\### 📊 Analytics

\- Transaction statistics.

\- Fraud transaction analysis.

\- Transaction type analysis.

\- Merchant-based analysis.

\- Location-based analysis.

\- Transaction amount analysis.



\### 🗄️ Database

MySQL is used to store application data including:



\- Customers

\- Accounts

\- Devices

\- Merchants

\- Transactions

\- Fraud alerts



\---



\# 🧠 Machine Learning



The project uses multiple Machine Learning algorithms for fraud classification.



\### Models Included



| Model | Purpose |

|---|---|

| Tuned XGBoost | Primary high-performance model |

| Random Forest | Ensemble classification |

| Logistic Regression | Baseline classification |

| Decision Tree | Tree-based classification |



The trained models and preprocessing objects are stored inside the:



```text

models/


\### ml pipeline



Transaction Input

&#x20;      ↓

Feature Preparation

&#x20;      ↓

Data Preprocessing

&#x20;      ↓

Feature Encoding

&#x20;      ↓

Trained ML Model

&#x20;      ↓

Fraud Prediction

&#x20;      ↓

Prediction Probability



\### System Architecture



&#x20;                   ┌─────────────────────┐

&#x20;                   │       User                 │

&#x20;                   └──────────┬──────────┘

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌─────────────────────┐

&#x20;                   │    Web Interface           │

&#x20;                   │   HTML/CSS/JS              │

&#x20;                   └──────────┬──────────┘

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌─────────────────────┐

&#x20;                   │    Flask Backend           │

&#x20;                   │      app.py                │

&#x20;                   └───────┬─────┬───────┘

&#x20;                               │     │

&#x20;                ┌──────────┘     └──────────┐

&#x20;                ▼                           ▼

&#x20;       ┌─────────────────┐        ┌─────────────────┐

&#x20;       │ Machine Learning      │        │  MySQL Database      │

&#x20;       │     Models            │        │ fraud\_detection      │

&#x20;       └────────┬────────┘        └─────────────────┘

&#x20;                │

&#x20;                ▼

&#x20;       ┌─────────────────┐

&#x20;       │ Fraud / Genuine       │

&#x20;       │    Prediction         │

&#x20;       └─────────────────┘



🛠️ Technologies Used



Programming \& Backend

\- Python

\- Flask



Machine Learning

\- Scikit-learn

\- XGBoost

\- Pandas

\- NumPy

\- Joblib



Frontend

\- HTML5

\- CSS3

\- JavaScript

\- Chart.js



Database

\- MySQL

\- MySQL Connector/Python



Development Tools

\- Visual Studio Code

\- Git

\- GitHub



📂 Project Structure



PREDICTIN\_CCARD/

│

├── app.py

├── model.py

├── database.py

├── train\_model.py

├── README.md

├── .gitignore

│

├── models/

│   ├── decision\_tree.pkl

│   ├── final\_xgboost.pkl

│   ├── logistic\_regression.pkl

│   ├── random\_forest.pkl

│   ├── one\_hot\_encoder.pkl

│   ├── target\_encoder.pkl

│   ├── scaler.pkl

│   └── other model files

│

├── templates/

│   ├── dashboard.html

│   ├── detect.html

│   ├── transactions.html

│   └── analytics.html

│

├── static/

│   ├── analytics.css

│   ├── analytics.js

│   ├── common.css

│   ├── common.js

│   ├── detect.css

│   ├── fraud.js

│   └── transactions.js

│

└── db/

&#x20;   └── mydb.sql



🗄️ Database Design



fraud\_detection



Main Table 



Customer

&#x20;  │

&#x20;  └── Account

&#x20;         │

&#x20;         └── Transaction

&#x20;                │

&#x20;                ├── Merchant

&#x20;                ├── Device

&#x20;                └── Fraud Alert



🚀 Installation \& Setup



1\. Clone the Repository



git clone <YOUR\_GITHUB\_REPOSITORY\_URL>

cd PREDICTIN\_CCARD



2\. Install Required Libraries



pip install flask mysql-connector-python pandas numpy scikit-learn xgboost joblib



3\. Configure MySQL



CREATE DATABASE fraud\_detection;

db/mydb.sql



4\. Configure Database Password



$env:DB\_PASSWORD="Shantanu@123"



5\. Run the Application



python app.py

http://127.0.0.1:5000



🔄 Fraud Detection Workflow



1\. User opens the application

&#x20;            ↓

2\. Selects existing customer or enters new customer details

&#x20;            ↓

3\. Enters transaction information

&#x20;            ↓

4\. Selects Machine Learning model

&#x20;            ↓

5\. Flask receives the transaction

&#x20;            ↓

6\. Features are prepared and encoded

&#x20;            ↓

7\. Trained ML model performs prediction

&#x20;            ↓

8\. System calculates prediction probability

&#x20;            ↓

9\. Result displayed as Fraud or Genuine

&#x20;            ↓

10\. Transaction information can be stored

&#x20;            ↓

11\. Analytics can be viewed



📊 Application Modules



🏠 Dashboard

Provides an overview of the fraud detection system and its main functionalities.



🔎 Detect Fraud

Allows the user to enter transaction information and obtain a Machine Learning based prediction.



💳 Transactions

Displays stored transaction information and transaction history.



📈 Analytics

Provides analytical insights related to:

\- Fraud transactions

\- Transaction types

\- Merchants

\- Locations

\- Transaction amounts

\- Risk information



🔐 Security

The project follows basic security practices:



\- Database credentials are provided through environment variables.

\- Large training datasets are excluded from the repository.

\- Temporary Python files are excluded.

\- Environment files are excluded.

\- Python cache files are excluded.



The following datasets are intentionally not included in the GitHub repository:

fraudTrain.csv

fraudTest.csv

credit\_card\_fraud\_dataset.csv



📈 Future Enhancements



Possible future improvements include:

\- Real-time fraud monitoring.

\- Advanced model explainability.

\- Automated model retraining.

\- User authentication and authorization.

\- Cloud deployment.

\- Advanced fraud-risk visualization.

\- Real-time notification system.



👨‍💻 Author

Shantanu Deshmukh

B.Tech – Artificial Intelligence \& Data Science

Project

AI-Based Fraud Transaction Detection \& Analytics System



⭐ Acknowledgement

This project was developed as an academic Machine Learning and DBMS project to demonstrate the practical application of Artificial Intelligence, Web Development and Database Management concepts in financial fraud detection.



📜 License

This project is developed for educational and academic purposes.



\### Ab save karo



`Ctrl + S` → Notepad close.



Phir \*\*sirf ye command\*\*:



```powershell

git add README.md

