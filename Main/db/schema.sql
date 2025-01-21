DROP DATABASE IF EXISTS department_db;
CREATE DATABASE department_db;
/*
DROP TABLE employee;
DROP TABLE role;
DROP TABLE department;
*/

CREATE TABLE department (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(30) NOT NULL
);

CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL,
    title VARCHAR(30),
    salary DECIMAL,
    FOREIGN KEY (department_id)
    REFERENCES department(id)
);

CREATE TABLE employee (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL,
    manager_id INT,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    FOREIGN KEY (role_id)
    REFERENCES role(id),
    FOREIGN KEY (manager_id) 
    REFERENCES employee(id) ON DELETE SET NULL
);