INSERT INTO records (id, title, category, description, status) VALUES
(1, 'Wi-Fi connection unavailable', 'Network', 'Staff workstation cannot connect to the campus wireless network.', 'Pending'),
(2, 'Install office productivity software', 'Software', 'Install and configure the approved office productivity suite.', 'In progress'),
(3, 'Keyboard keys not responding', 'Hardware', 'Several keys on the computer keyboard do not respond when pressed.', 'Completed'),
(4, 'Slow internet connection', 'Network', 'Internet access is unusually slow in the computer laboratory.', 'Pending'),
(5, 'Application fails to launch', 'Software', 'The student records application closes immediately after launch.', 'In progress'),
(6, 'Monitor displays a blank screen', 'Hardware', 'Desktop computer powers on but the monitor remains blank.', 'Pending'),
(7, 'Network printer unreachable', 'Network', 'Users cannot find or connect to the shared departmental printer.', 'Completed'),
(8, 'Update antivirus definitions', 'Software', 'Update antivirus definitions on the laboratory computers.', 'Pending')
ON CONFLICT (id) DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('records', 'id'),
    GREATEST(COALESCE((SELECT MAX(id) FROM records), 1), 1),
    EXISTS (SELECT 1 FROM records)
);