-- Insert final batch of questionnaire questions
INSERT INTO public.questionnaire_questions (question_text, category, question_type, responsible_party, sort_order, is_required, help_text, options, created_by) VALUES

-- Customer Experience Questions
('Do you offer appointments for customers?', 'Customer Experience', 'yes_no', 'Ops', 1, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Does your business respond to Google/Yelp reviews? If so, who manages this?', 'Customer Experience', 'text', 'Ops', 2, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you offer labor warranties or guarantees? What are the terms?', 'Customer Experience', 'textarea', 'Ops', 3, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you provide shuttle service, loaner vehicles, or pickup/drop-off?', 'Customer Experience', 'checkbox', 'Ops', 4, false, null, '["Shuttle service", "Loaner vehicles", "Pickup/drop-off", "None"]', '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What is the current balance of customer deposits?', 'Customer Experience', 'number', 'Ops', 5, false, 'Enter dollar amount', null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),

-- Marketing Questions  
('What drives your marketing success?', 'Marketing', 'textarea', 'M&A', 1, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you have any customer loyalty or rewards programs?', 'Marketing', 'yes_no', 'M&A', 2, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What email addresses are website leads routed to?', 'Marketing', 'text', 'M&A', 3, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are any phones on a forwarding service?', 'Marketing', 'yes_no', 'M&A', 4, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you have any phone number or tracking providers?', 'Marketing', 'text', 'M&A', 5, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you conduct e-commerce?', 'Marketing', 'yes_no', 'M&A', 6, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you store a list of customer email addresses?', 'Marketing', 'yes_no', 'M&A', 7, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you store a list of customer physical addresses?', 'Marketing', 'yes_no', 'M&A', 8, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you have a third party email service (e.g., MailChimp, Constant Contact)?', 'Marketing', 'text', 'M&A', 9, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you use a listing management service (Moz, BrightLocal, Local Falcon)?', 'Marketing', 'text', 'M&A', 10, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you have a chat and/or SMS service?', 'Marketing', 'checkbox', 'M&A', 11, false, null, '["Chat service", "SMS service", "Both", "None"]', '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Who do you consider your strongest competitors?', 'Marketing', 'textarea', 'M&A', 12, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are there any products or services you don''t offer that you would like to offer?', 'Marketing', 'textarea', 'M&A', 13, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Does your store have any important community sponsorships?', 'Marketing', 'textarea', 'M&A', 14, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Who is your domain / website hosting provider?', 'Marketing', 'text', 'M&A', 15, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('When does your current hosting contract expire?', 'Marketing', 'text', 'M&A', 16, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('When does the current website / content management contract expire?', 'Marketing', 'text', 'M&A', 17, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),

-- Technology & Systems Questions
('What POS system do you use?', 'Technology & Systems', 'text', 'Ops', 1, true, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you use a scheduling system?', 'Technology & Systems', 'text', 'Ops', 2, false, 'If yes, please specify which system', null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you use digital vehicle inspections? If so, which platform?', 'Technology & Systems', 'text', 'Ops', 3, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),

-- Facilities & Equipment Questions
('Are there any known issues or major upgrades needed for your equipment?', 'Facilities & Equipment', 'textarea', 'Ops', 1, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Is any equipment leased?', 'Facilities & Equipment', 'yes_no', 'Ops', 2, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you have recent equipment repair and maintenance records?', 'Facilities & Equipment', 'yes_no', 'Ops', 3, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Who are your preferred equipment repair and maintenance vendors?', 'Facilities & Equipment', 'textarea', 'Ops', 4, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),

-- Compliance, Insurance, & Safety Questions
('What is the current safety training and inspection process?', 'Compliance/Insurance/Safety', 'textarea', 'Ops', 1, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you have any recent or ongoing OSHA, EPA, or environmental investigations?', 'Compliance/Insurance/Safety', 'yes_no', 'Ops', 2, true, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are all locations current on business licenses and local compliance?', 'Compliance/Insurance/Safety', 'yes_no', 'Ops', 3, true, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you provide roadside assistance, tire delivery, casing, or other services to fleet customers?', 'Compliance/Insurance/Safety', 'checkbox', 'Ops', 4, false, null, '["Roadside assistance", "Tire delivery", "Casing services", "Other fleet services", "None"]', '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you service fleet providers through National Accounts?', 'Compliance/Insurance/Safety', 'yes_no', 'Ops', 5, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do fleet customers receive priority scheduling or service?', 'Compliance/Insurance/Safety', 'yes_no', 'Ops', 6, false, null, null, '1518641a-2a7b-4b31-868b-bd0ce06986ce');

-- Update the "Is the building owned or leased?" question to include options
UPDATE public.questionnaire_questions 
SET options = '["Owned", "Leased"]'
WHERE question_text = 'Is the building owned or leased?';