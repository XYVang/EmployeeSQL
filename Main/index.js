import inquirer from "inquirer";
import {pool, connectToDb } from './connections/connection.js';

// Inquirer menu to prompt the user for an action
function menu() {
    inquirer
        .prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'What would you like to do?',
            choices: [
                'View all departments', 
                'View all roles', 
                'View all employees', 
                'Add a department', 
                'Add a role', 
                'Add a employee', 
                'Update an employee role',
                'Quit', 
            ]
        }
    ])
        .then((answers) => {
        if (answers.choice === 'View all departments') {
            viewAllDepartments();
        }
        if (answers.choice === 'View all roles') {
            viewAllRoles();
        }
        if (answers.choice === 'View all employees') {
            viewAllEmployees();
        }
        if (answers.choice === 'Add a department') {
            addDepartment();
        }
        if (answers.choice === 'Add a role') {
            addRole();
        }
        if (answers.choice === 'Add a employee') {
            addEmployee();
        }
        if (answers.choice === 'Update an employee role') {
            updateEmployeeRole();
        }
        if (answers.choice === 'Quit') {
            pool.end();
            process.exit();
        }
    });
}

// Functions to do the prompted choices above
function viewAllDepartments() {
    pool.query('SELECT department.id, name FROM department', (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
        } 
        else {
            console.table(result.rows);
        }
        menu();
    });
}


function viewAllRoles() {
    // Shows role id, department name they belong to, title, and salary
    pool.query(
        `SELECT r.id, d.name AS department_name, r.title, r.salary FROM role r JOIN department d ON r.department_id = d.id;`, 
        (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
            } 
            else {
                console.table(result.rows);
            }
            menu();
        }
    );
}

function viewAllEmployees() {
    // Shows the employee's id, names, title, department name, salary, and manager names
    pool.query(
        `SELECT e.id AS employee_id, e.first_name, e.last_name, r.title AS job_title, d.name AS department_name, r.salary, m.first_name AS manager_first_name, m.last_name AS manager_last_name FROM employee e JOIN role r ON e.role_id = r.id JOIN department d ON r.department_id = d.id LEFT JOIN employee m ON e.manager_id = m.id;`, 
        (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
            } 
            else {
                console.table(result.rows);
            }
            menu();
        }
    );
}

function addDepartment () {
    inquirer
        .prompt([
            {
                type: 'input',
                name: 'newDepartment',
                message: 'Enter a name for the new department',
            }
        ])
        .then((answers) => {
            let newDepartment = answers.newDepartment;

            pool.query(`INSERT INTO department (name) VALUES ($1)`, [newDepartment], 
                (err, result) => {
                    if (err) {
                        console.error('Error executing query:', err);
                    } 
                    else {
                        console.log(`New department '${newDepartment}' has been added`);
                    }
                    menu();
                }
            );
        });
}

function addRole() {
    pool.query(`SELECT id, name FROM department`, (err, results) => {
        if (err) {
            console.error("Error trying to get departments:", err);
            return;
        }

        const departments = results.rows.map(department => ({name: department.name, value: department.id}));

        inquirer
            .prompt([
                {
                    type: 'input',
                    name: 'roleTitle',
                    message: 'Enter the title for the new role:',
                },
                {
                    type: 'input',
                    name: 'roleSalary',
                    message: 'Enter the salary for the new role:',
                },
                {
                    type: 'list',
                    name: 'departmentId',
                    message: 'Select the department for this role:',
                    choices: departments
                }
            ])
            .then(answers => {
                const { roleTitle, roleSalary, departmentId } = answers;

                pool.query(`INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)`, [roleTitle, roleSalary, departmentId],
                    (err, result) => {
                        if (err) {
                            console.error("Error executing query:", err);
                        } 
                        else {
                            console.log(`New role '${roleTitle}' has been added.`);
                        }
                        menu();
                    }
                );
            });
    });
}

function addEmployee() {
    // Find the roles and the managers
    const rolesQuery = `SELECT id, title FROM role`;
    const managersQuery = `SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee`;

    Promise.all([
        pool.query(rolesQuery),
        pool.query(managersQuery)
    ])
    .then(([rolesResult, managersResult]) => {
        const roles = rolesResult.rows;
        const managers = managersResult.rows;

        // Create an array of manager names
        const nameOfRoles = roles.map(row => row.title);
        const nameOfManagers = managers.map(manager => manager.name); 

        inquirer
            .prompt([
                {
                    type: 'input',
                    name: 'firstName',
                    message: 'Enter the first name of employee',
                },
                {
                    type: 'input',
                    name: 'lastName',
                    message: 'Enter the last name of employee',
                },
                {
                    type: 'list',
                    name: 'idOfRole',
                    message: 'What is the role of the employee',
                    choices: nameOfRoles,
                },
                {
                    type: 'list',
                    name: 'managerName',
                    message: 'Who is the manager of this employee',
                    choices: nameOfManagers,
                }
            ])
            .then((answers) => {
                const { firstName, lastName, idOfRole, managerName } = answers;

                // Find the selected role ID respective to what is chosen
                const selectedRole = roles.find(role => role.title === idOfRole);
                const roleId = selectedRole.id;

                // Find the selected manager ID respective to what is chosen
                const selectedManager = managers.find(manager => manager.name === managerName);
                const managerId = selectedManager ? selectedManager.id : null; // If no manager is selected, set to null

                // Insert new employee
                pool.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${firstName}', '${lastName}', ${roleId}, ${managerId})`, (err, result) => {
                    if (err) {
                        console.error('Error executing query:', err);
                    } 
                    else {
                        console.log(`New employee ${firstName} ${lastName} has been added`);
                    }
                    menu();
                });
            });
    })
    .catch(err => {
        console.error('Error executing query:', err);
        menu();
    });
}

function updateEmployeeRole() {
    // Find employees and roles for update
    const employeesQuery = `SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee`;
    const rolesQuery = `SELECT id, title FROM role`;

    Promise.all([
        pool.query(employeesQuery),
        pool.query(rolesQuery)
    ])
    .then(([employeesResult, rolesResult]) => {
        const employees = employeesResult.rows;
        const roles = rolesResult.rows;

        const nameOfEmployees = employees.map(emp => emp.name);
        const nameOfRoles = roles.map(role => role.title);

        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'employeeName',
                    message: 'Choose an employee to update their role',
                    choices: nameOfEmployees,
                },
                {
                    type: 'list',
                    name: 'newRole',
                    message: 'Choose the new role for the employee',
                    choices: nameOfRoles,
                }
            ])
            .then((answers) => {
                const { employeeName, newRole } = answers;

                // Find the selected employee ID respective to what is chosen
                const selectedEmployee = employees.find(emp => emp.name === employeeName);
                const employeeId = selectedEmployee.id;

                // Find the selected role ID respective to what is chosen
                const selectedRole = roles.find(role => role.title === newRole);
                const roleId = selectedRole.id;

                // Update the employee's role
                pool.query(`UPDATE employee SET role_id = ${roleId} WHERE id = ${employeeId}`, (err, result) => {
                    if (err) {
                        console.error('Error executing query:', err);
                    } 
                    else {
                        console.log(`Updated ${employeeName}'s role to ${newRole}`);
                    }
                    menu();
                });
            });
    })
    .catch(err => {
        console.error('Error executing query:', err);
        menu();
    });
}

await connectToDb();
menu();