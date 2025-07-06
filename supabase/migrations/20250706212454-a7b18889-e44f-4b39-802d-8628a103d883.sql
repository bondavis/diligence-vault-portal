-- Insert initial questionnaire questions
-- First, get a user ID for created_by (we'll use the admin user)
INSERT INTO public.questionnaire_questions (question_text, category, question_type, responsible_party, sort_order, is_required, created_by) VALUES

-- Business Snapshot Questions
('What year did the business open?', 'Business Snapshot', 'number', 'M&A', 1, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How many years has the Seller been operating in the current facility?', 'Business Snapshot', 'number', 'M&A', 2, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Are there any closed retail locations still under ownership? If so, how many?', 'Business Snapshot', 'text', 'M&A', 3, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Is the building owned or leased?', 'Business Snapshot', 'radio', 'M&A', 4, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What is the go-forward rent?', 'Business Snapshot', 'number', 'M&A', 5, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Building square footage?', 'Business Snapshot', 'number', 'M&A', 6, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Any known environmental issues?', 'Business Snapshot', 'yes_no', 'M&A', 7, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),

-- Key Metrics Questions
('Number of Bays', 'Key Metrics', 'number', 'Ops', 1, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Tire capacity', 'Key Metrics', 'number', 'Ops', 2, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Tire deliveries per week', 'Key Metrics', 'number', 'Ops', 3, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Retail percentage (%)', 'Key Metrics', 'number', 'Ops', 4, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),

-- Service Mix Questions (percentages)
('Wholesale Tires (%)', 'Service Mix', 'number', 'Ops', 1, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Medium Duty or Ag Tires (%)', 'Service Mix', 'number', 'Ops', 2, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Standard PLT Retail Tires (%)', 'Service Mix', 'number', 'Ops', 3, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Parts (%)', 'Service Mix', 'number', 'Ops', 4, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Fluid (%)', 'Service Mix', 'number', 'Ops', 5, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Heavy Mechanical Labor (Engine / Transmissions) (%)', 'Service Mix', 'number', 'Ops', 6, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),

-- Sales Questions
('Is the Seller active on the sales counter helping customers?', 'Sales', 'yes_no', 'Ops', 1, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How many hours is the Seller working in the business per week?', 'Sales', 'number', 'Ops', 2, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What do you charge for flat tire repairs?', 'Sales', 'number', 'Ops', 3, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How many flat tire repairs are performed per month?', 'Sales', 'number', 'Ops', 4, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What do you charge for tire rotations?', 'Sales', 'number', 'Ops', 5, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('How many tire rotations are performed per month?', 'Sales', 'number', 'Ops', 6, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Do you sell used or take-off tires?', 'Sales', 'yes_no', 'Ops', 7, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('On average, how many used tire units are you selling per month?', 'Sales', 'number', 'Ops', 8, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('What is the targeted tire markup percentage?', 'Sales', 'number', 'Ops', 9, true, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Any deliveries to fleet, commercial, or wholesale customers?', 'Sales', 'yes_no', 'Ops', 10, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Any wholesale business?', 'Sales', 'yes_no', 'Ops', 11, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Any government accounts?', 'Sales', 'yes_no', 'Ops', 12, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce'),
('Any accounts under contract?', 'Sales', 'yes_no', 'Ops', 13, false, '1518641a-2a7b-4b31-868b-bd0ce06986ce');