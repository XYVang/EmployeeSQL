
INSERT INTO department (department_name)
VALUES  ('Sales'),
        ('Engineering'),
        ('Legal');

INSERT INTO role (title, salary, department_id)
VALUES  ('Sales Manager', 80000, 1),
        ('Lead Engineer', 200000, 2),
        ('Software Engineer', 130000, 2),
        ('Lawyer', 190000, 3);


INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES  ('Xavier', 'Vang', 2, NULL),
        ('Nicolas', 'Cage', 1, NULL),
        ('Ari', 'Frueta', 3, 9),
        ('Bones', 'Jones', 4, 10);