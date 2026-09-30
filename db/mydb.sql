CREATE DATABASE fraud_detection_new;

USE fraud_detection_new;
USE fraud_detection_new;

CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address VARCHAR(255),
    latitude DOUBLE DEFAULT 0,
    longitude DOUBLE DEFAULT 0,
    city_population BIGINT DEFAULT 0,
    date_of_birth DATE,
    gender VARCHAR(20),
    job VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE merchant (
    merchant_id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    location VARCHAR(150),
    latitude DOUBLE DEFAULT 0,
    longitude DOUBLE DEFAULT 0
);

CREATE TABLE account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    account_number VARCHAR(30) UNIQUE NOT NULL,
    account_type VARCHAR(50),
    balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_account_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id)
);

CREATE TABLE device (
    device_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    ip VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaction (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    merchant_id INT NOT NULL,
    device_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(50),
    transaction_time DATETIME,
    location VARCHAR(150),
    status VARCHAR(30) DEFAULT 'PENDING',
    merchant_category VARCHAR(100),
    fraud_probability DECIMAL(8,4),
    risk_level VARCHAR(30),

    CONSTRAINT fk_transaction_account
        FOREIGN KEY (account_id)
        REFERENCES account(account_id),

    CONSTRAINT fk_transaction_merchant
        FOREIGN KEY (merchant_id)
        REFERENCES merchant(merchant_id),

    CONSTRAINT fk_transaction_device
        FOREIGN KEY (device_id)
        REFERENCES device(device_id)
);


SELECT * FROM customer;
SELECT * FROM account;
SELECT * FROM merchant;
SELECT * FROM device;
USE fraud_detection_new;

SELECT *
FROM transaction
ORDER BY transaction_id DESC
LIMIT 5;