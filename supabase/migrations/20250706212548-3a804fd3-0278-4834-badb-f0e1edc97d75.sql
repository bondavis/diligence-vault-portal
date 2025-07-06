-- Insert remaining questionnaire questions
INSERT INTO public.questionnaire_questions (question_text, category, question_type, responsible_party, sort_order, is_required, help_text, options, created_by) VALUES

-- HR Questions
('Do employees receive benefits?', 'HR', 'yes_no', 'Ops', 1, true, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Does the company offer a 401K program?', 'HR', 'yes_no', 'Ops', 2, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are any employees paid in cash?', 'HR', 'yes_no', 'Ops', 3, true, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do any employees receive bonuses or profit sharing?', 'HR', 'yes_no', 'Ops', 4, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you have any employees at risk of leaving?', 'HR', 'yes_no', 'Ops', 5, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you have any employees considering retirement?', 'HR', 'yes_no', 'Ops', 6, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What is your pay period?', 'HR', 'select', 'Ops', 7, true, null, '["Weekly", "Bi-weekly", "Monthly", "Semi-monthly"]', '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do employees punch in and out via a timecard system?', 'HR', 'yes_no', 'Ops', 8, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How do employees accrue vacation?', 'HR', 'textarea', 'Ops', 9, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are any FT employees scheduled less than 5 days per week?', 'HR', 'yes_no', 'Ops', 10, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are there any specific work schedule agreements with any employee?', 'HR', 'yes_no', 'Ops', 11, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How many family members are in the business? What are their roles?', 'HR', 'textarea', 'Ops', 12, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are there any current open positions?', 'HR', 'yes_no', 'Ops', 13, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Who creates the employee schedules?', 'HR', 'text', 'Ops', 14, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Who makes the hiring and firing decisions?', 'HR', 'text', 'Ops', 15, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How many employees have keys to open or close the facility?', 'HR', 'number', 'Ops', 16, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How are store leaders compensated?', 'HR', 'select', 'Ops', 17, false, null, '["Salary", "Hourly", "Commission", "Salary + Commission", "Other"]', '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What is your technician pay model?', 'HR', 'select', 'Ops', 18, true, null, '["Flat rate", "Hourly", "Commission", "Production-based", "Mixed model"]', '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are any employees due for a raise or promised a raise/promotion in the near future?', 'HR', 'yes_no', 'Ops', 19, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Will any employees feel upset that you did not sell your business to them?', 'HR', 'yes_no', 'Ops', 20, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),

-- Operational Questions
('Confirm store hours', 'Operational', 'text', 'Ops', 1, true, 'Please provide your operating hours (e.g., Mon-Fri 8AM-6PM, Sat 8AM-4PM)', null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are there any additional days the business is closed throughout the month?', 'Operational', 'textarea', 'Ops', 2, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you perform vehicle inspections (digital or paper)?', 'Operational', 'select', 'Ops', 3, false, null, '["Digital", "Paper", "Both", "None"]', '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you perform a documented vehicle check-in process (digital or paper)?', 'Operational', 'select', 'Ops', 4, false, null, '["Digital", "Paper", "Both", "None"]', '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Does your business perform oil change services?', 'Operational', 'yes_no', 'Ops', 5, true, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How many oil change units are you servicing per month?', 'Operational', 'number', 'Ops', 6, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Is the facility zoned to perform oil changes?', 'Operational', 'yes_no', 'Ops', 7, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What third-party credit and/or lease-to-own (LTO) options do you offer?', 'Operational', 'checkbox', 'Ops', 8, false, null, '["Synchrony", "Progressive", "Snap Finance", "Acima", "Other", "None"]', '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do employees receive incentives for submitting third-party credit applications?', 'Operational', 'yes_no', 'Ops', 9, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How many tire units are sold per month?', 'Operational', 'number', 'Ops', 10, true, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How many paid tickets per month?', 'Operational', 'number', 'Ops', 11, true, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What is your average revenue per ticket?', 'Operational', 'number', 'Ops', 12, true, 'Enter dollar amount', null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What is your typical accounts receivable balance by month?', 'Operational', 'number', 'Ops', 13, false, 'Enter dollar amount', null, '1518641a-2a7b-4b31-868b-bd0ce06986ce');