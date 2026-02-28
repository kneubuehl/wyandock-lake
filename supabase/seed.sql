-- Up North — Seed Data
-- Run AFTER migration.sql
-- Note: Procedures are inserted without created_by/updated_by since we may not have user IDs yet.
-- You can update these after users are created.

-- ============================================
-- PARENT SCHEDULE
-- ============================================
INSERT INTO public.parent_schedule (year, first_parent) VALUES
  (2026, 'cheryl'),
  (2027, 'stephen_sr')
ON CONFLICT (year) DO NOTHING;

-- ============================================
-- SECURITY CODES
-- ============================================
INSERT INTO public.security_codes (label, code, notes) VALUES
  ('SimpliSafe — Family', '2034', 'Main alarm code'),
  ('SimpliSafe — Cleaner', '0926', 'For cleaning service'),
  ('Garage Key Box', '0521', NULL),
  ('Wi-Fi Password', 'wyandock', 'Network: kneubuehl');

-- ============================================
-- VENDOR CONTACTS
-- ============================================
INSERT INTO public.vendor_contacts (name, phone, category, notes) VALUES
  ('Don and Dawn Pawlak', '(715) 661-1784', 'Property Manager', 'pawlakfamily711@gmail.com'),
  ('Quality Heating', '(715) 358-2644', 'HVAC', 'Annual boiler service');

-- ============================================
-- PROCEDURES
-- ============================================
INSERT INTO public.procedures (title, content, category) VALUES
  ('Water On/Off', '<p>Always turn off water when house will be vacant for extended periods (more than 3 days).</p><p>All major steps are marked with <strong>orange tape</strong>. For circulator pump, only plug/unplug the right side plug, not the entire splitter.</p><ol><li>Turn on (off) well breakers</li><li>Turn on (off) hot water heater switch</li><li>Plug in (unplug) hot water circulator pump</li></ol>', 'HVAC'),

  ('Boiler Overflow Tank', '<p>In 2023, an overflow tank was installed to help assure the system keeps proper pressure regulation.</p><p>The tank next to the boiler should always have visible antifreeze fluid in it, and should be on the fuller side. If it''s very low, you can add some antifreeze from the blue carton.</p><p>Quality Heating will add appropriate antifreeze during their annual service.</p>', 'HVAC'),

  ('Boat Lift Storage', '<ol><li>Assure all ballasts are empty at 0%. Tap Profiles &gt; Go Home &gt; Activate to empty.</li><li>Lower tow boom following procedure.</li><li>Stow rear view mirror in downward position.</li><li>Drive or manually pull boat into lift area.</li><li>Align the front crossbar midway between bow tip and tow hook.</li><li>With assistance, align boat approximately in center of lift, then begin lifting until stationary.</li><li>Exit boat. Lift until bottom of center crossbars are out of water.</li></ol>', 'Boat'),

  ('Boat On/Off', '<ol><li>Turn on battery master switch under rear left seat cushion</li><li>Turn key to on position</li><li>Press push-to-start button</li><li>To turn off, turn key to off position. For longer term storage, turn off master battery switch.</li></ol><p><strong>Notes:</strong></p><ul><li>Turning key off does not turn off ballast system. Ballast will finish fill/unfill action.</li><li>Turning key off does not turn off stereo system. You must push and hold stereo power button separately.</li></ul>', 'Boat'),

  ('Boat Boom Up/Down', '<ol><li>Unlatch boom lock mechanisms at base of boom (if not already unlocked)</li><li>Lift boom into upright position</li><li>Press boom locks at base of boom until latched</li><li>Swing out board holder arms</li></ol><p>For lowering boom, complete above procedure in reverse order.</p><p><strong>⚠️ Important:</strong></p><ul><li>Assure board holders are swung to the inside position before lowering boom. Failure to do so will harm boat fiberglass shell.</li><li>Assure boom is fully latched before putting boat in gear. Failure to do so can result in boom lowering unexpectedly and injuring passengers.</li></ul>', 'Boat'),

  ('Boat Bluetooth Stereo', '<ol><li>Press red power button to turn on stereo.</li><li>Assure stereo is in "Aux" input by pressing the source button (arrow symbol →)</li><li>On phone, go to Bluetooth settings and connect to "FUSION" device.</li></ol><p>Turn off by pressing and holding the power button. Boat key will not turn off stereo.</p>', 'Boat'),

  ('Hot Tub Chemical Maintenance', '<ul><li>Use test strip to get reading of Chlorine, pH, and Alkalinity</li><li>Always balance the pH first. Add 2 large capfuls at a time, run 10-min clean cycle, and re-test.</li><li>Keep chlorine dispenser filled with tablets. The dispenser should be minimally opened by only a few screws during normal operation.</li><li>During heavy usage, add a cap of shock at end of day or first thing in morning. Run clean cycle and wait 30 minutes before next use.</li></ul>', 'Hot Tub'),

  ('Hot Tub Filter Maintenance', '<ul><li>During heavy usage or at least once a month, take out filters and spray with hose gun.</li><li>For heavy cleaning, purchase filter cleaner and soak cleaners, then spray with hose.</li></ul>', 'Hot Tub'),

  ('Hot Tub Water Level', '<p>Keep water level near bottom of head rests.</p><ul><li>During summer, use hose located under deck.</li><li>During winter, connect extra hose in mechanical room to the laundry hose line for easy access.</li></ul>', 'Hot Tub'),

  ('Hot Tub Troubleshooting', '<ul><li>Normal operation should show a solid red ON light and a solid green READY light.</li><li>If an error is occurring, try resetting both breakers at breaker box under mid-deck.</li><li>If both blinking and no heating, filters are likely dirty. Clean filters with hose, balance chemicals, circulate water, and then reset breakers.</li></ul>', 'Hot Tub');

-- ============================================
-- MAINTENANCE TASKS
-- ============================================
INSERT INTO public.maintenance_tasks (title, description, recurrence, next_due_date, status) VALUES
  ('Hot tub filter cleaning', 'Spray filters with hose gun', 'monthly', '2026-03-15', 'pending'),
  ('Boiler service (Quality Heating)', 'Annual service — add antifreeze, check overflow tank', 'annual', '2026-10-01', 'pending'),
  ('Boat registration renewal', 'Renew at https://gowild.wi.gov/products/quicksale/renewals — Current: WS 8239 JJ', 'custom', '2027-03-31', 'pending');
