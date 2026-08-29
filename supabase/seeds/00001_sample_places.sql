-- Seed Data for Sample Real-World Places across popular cities
-- Note: Places only - NO fake user memories!

INSERT INTO public.places (name, category, latitude, longitude, radius_meters) VALUES
('Blue Bottle Coffee', 'Cafe', 37.7763, -122.4233, 50),
('Dolores Park', 'Park', 37.7596, -122.4269, 150),
('UC Berkeley Campus', 'College', 37.8719, -122.2585, 200),
('Ocean Beach', 'Beach', 37.7594, -122.5107, 250),
('The Fillmore Concert Hall', 'Concert', 37.7841, -122.4331, 300),
('Coit Tower Landmark', 'Landmark', 37.8024, -122.4058, 100),
('Ferry Building Marketplace', 'Shopping', 37.7955, -122.3937, 100),
('Sightglass Coffee', 'Cafe', 37.7768, -122.4086, 50),
('Golden Gate Park Conservatory', 'Park', 37.7726, -122.4604, 150),
('Stanford University Quad', 'College', 37.4275, -122.1697, 200)
ON CONFLICT DO NOTHING;
