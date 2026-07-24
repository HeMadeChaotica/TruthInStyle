# CLOCK.IT — Tentative App-Wide Control Registry

Status: discovery draft for Eugene review.  
Purpose: make CLOCK.IT the single place where every reusable app dropdown, picker, wheel, and option library is stored and edited.

## Control Types

- **Editable list** — add, rename, reorder, disable, restore defaults.
- **Numeric wheel** — CLOCK.IT owns minimum, maximum, step, unit, and default.
- **Color library** — label, color value, active state, and display order.
- **Quote library** — text, author, source, category, active state, and order.
- **Dynamic relation** — populated from saved app records, not manually edited as a normal list.
- **Fixed system choice** — visible in CLOCK.IT for documentation, but not freely editable because changing it affects application logic.
- **Native picker** — date, time, or file picker; not an editable dropdown.
- **Free text / autocomplete history** — remains typeable; CLOCK.IT may manage saved suggestions without preventing new text.

## Global CLOCK.IT Behaviors

Every editable registry should support:

1. Add option.
2. Rename option without breaking saved historical records.
3. Reorder options.
4. Disable/enable option.
5. Restore official defaults.
6. Preserve older saved values even if an option is disabled.
7. Save through cloud state/Supabase, not production-only local storage.
8. Broadcast changes so open sections refresh without reloading.
9. Show which section and field consume each registry.
10. Distinguish display label from stable internal key.

Numeric wheels should support:

- minimum
- maximum
- step
- unit
- default
- optional blank value

## 1. THE.ASSURER

| Field | Proposed control | Tentative source/range | CLOCK.IT behavior |
|---|---|---|---|
| Mood | Editable list | Use full supplied `assessmentMood` list | Add, rename, reorder, disable |
| Era | Editable list | Use full supplied `assessmentEra` list | Add, rename, reorder, disable |
| Singleness Level | Editable list | Use full supplied `assessmentSingleness` list | Add, rename, reorder, disable |
| Lobito Check-In | Editable list | Use full supplied `lobitoCheckIn` list | Add, rename, reorder, disable |
| Weather City | Editable list | Current weather-city list | Add city, reorder, disable; preserve search |
| Head Hummer | Free text + suggestion history | Songs/loops previously entered | Allow typing anything; manage saved suggestions |
| Location | Free text + suggestion history | Previously used locations | Allow typing anything; manage saved suggestions |
| Word of the Day | Free text | No dropdown | Not a CLOCK.IT list |
| Penny Questions | Curated question library | Existing official question bank | Add, edit, reorder, enable/disable |
| Battle Cry Quotes | Quote library | Existing verified quote bank | Add quote with author/source/category |

## 2. ITS.GETTING.THICC — THICC.STATS

| Field | Proposed control | Tentative source/range | CLOCK.IT behavior |
|---|---|---|---|
| Sex | Editable list | MALE, FEMALE, OTHER + additions | Add, rename, reorder, disable |
| Sexual Orientation | Editable list | STRAIGHT, GAY, BI, OTHER + additions | Add, rename, reorder, disable |
| Height | Two-part numeric wheel | 4 ft 0 in–7 ft 6 in; feet/inches display; 1-inch step | Edit min/max/default |
| Age | Numeric wheel | 18–100; step 1 year | Edit min/max/default |
| Relationship Status | Editable list | SINGLE, MARRIED plus approved additions | Add, rename, reorder, disable |
| Client Color | Color library | Current 30 client colors | Add/edit label and hex; order; enable/disable |
| Current Weight | Shared numeric wheel | **120–400 lb; step 1 lb** | Uses shared Current/Goal Weight configuration |
| Goal Weight | Shared numeric wheel | **120–400 lb; step 1 lb** | Uses shared Current/Goal Weight configuration |
| Current BMI | Calculated value | Derive from height/current weight | Do not make a dropdown |
| Goal BMI | Calculated value | Derive from height/goal weight | Do not make a dropdown |
| Activity Level | Editable list | Existing six activity-level choices | Add, rename, reorder, disable |

Recommended correction: `sex`, `sexualOrientation`, `height`, `age`, `currentWeight`, and `goalWeight` are currently plain inputs or partially hard-coded. They should consume CLOCK.IT controls.

## 3. ITS.GETTING.THICC — TRAINING / CLIENT SYSTEM

| Field | Proposed control | Tentative source/range | CLOCK.IT behavior |
|---|---|---|---|
| Training / Rest | Editable list | TRAINING, REST, ACTIVE RECOVERY, OFF | Add, rename, reorder, disable |
| Program Split / Workout Day | Editable list | FULL BODY, UPPER, LOWER, PUSH, PULL, LEGS, GLUTES, CHEST, BACK, SHOULDERS, ARMS, CARDIO, CONDITIONING, MOBILITY, CUSTOM | Add, rename, reorder, disable |
| Upcoming Training Event Type | Editable list | WEDDING, ANNIVERSARY, BIRTHDAY, VACATION, UPCOMING SURGERY, CUSTOM | Add, rename, reorder, disable |
| Payment Schedule | Editable list | WEEKLY, BI-WEEKLY, MONTHLY | Add, rename, reorder, disable |
| Flexibility Level | Editable list | LOW, MODERATE, HIGH plus approved themed labels | Add, rename, reorder, disable |
| Referral Status | Editable list | NONE, REFERRED, BONUS APPLIED | Add, rename, reorder, disable |
| MyFitFoods Verified | Locked system choice | YES / NO | Display in CLOCK.IT, but do not allow editing |
| Weekly Number of Meals | Numeric wheel | 0–35; step 1 meal | Edit range |
| Vault Compound | Shared editable list | Same official compound library as THICC.FITT | One shared registry |
| Vault Ester/Form | Shared editable list | Same official ester/form library as THICC.FITT | One shared registry |
| Vault Amount | Two typed dose registries | CC values and MG values remain separate | Shared with THICC.FITT; never mix units silently |
| Vault Sensitivity / Side Effects | Editable list + custom note | Supplied sensitivity list | Select known value, allow notes |
| Cycle Week | Numeric wheel pair | Current 1–52; Total 1–52 | Edit range |
| Shot Number | Numeric wheel pair | Current 1–100; Total 1–100 | Edit range |
| Referral Date | Native date | Calendar | Not a list |
| Referral Name/Notes | Free text | No dropdown | Not a list |

## 4. THICC.TIME SCHEDULER

| Field | Proposed control | Tentative source/range | CLOCK.IT behavior |
|---|---|---|---|
| Entry Layer | Locked system choice | PERSONAL / CLIENT | Display in CLOCK.IT, but do not allow editing |
| Client | Dynamic relation | Saved THICC.PEOPLE clients | Never maintain as a manual option list |
| Start / End | Native time picker | Clock time | Not a list |
| Workout Label | Editable list + custom entry | Shared Program Split/Workout library | Select or type custom |
| Location | Free text + suggestion history | Previously used locations | Manage suggestions |
| Repeat | Locked recurrence family | NONE, WEEKLY initially | Display in CLOCK.IT, but do not allow editing |
| Repeat Days | Locked weekday set | SUN–SAT | Display in CLOCK.IT, but do not allow editing |
| Schedule Color | Dynamic relation | Client color or Mista.THICC pink | Driven by color library |

## 5. THICC.FITT — SESSION ENTRY

| Field | Proposed control | Tentative source/range | CLOCK.IT behavior |
|---|---|---|---|
| Gym | Free text + suggestion history | CHAOTICA and previously used gyms | Select suggestion or type |
| Season / Phase | Editable list | Use full supplied `roidSeason` list | Replace simplified four-item live list |
| Soreness Level | Editable list | Existing seven soreness choices | Add, rename, reorder, disable |
| Workout Length | Editable duration list | Use supplied 20/30/45/90/120 plus 60 MIN | Add/reorder; normalize minutes |
| Prep Status | Editable list | Existing prep-status list | Add, rename, reorder, disable |
| Exercise | Editable exercise library + custom | User-defined exercise bank | Add categories, aliases, enable/disable |
| Exercise Weight | Numeric wheel | 0–1,000 lb; **5-lb step only** | Edit min/max/unit; increment is locked at 5 lb |
| Reps | Numeric wheel | 1–100; step 1 | Edit range |
| Sets | Numeric wheel | 1–20; step 1 | Edit range |
| Failure | Locked system choice | YES / NO | Display in CLOCK.IT, but do not allow editing |
| Rest | Numeric duration wheel | 0–10 min; 15-sec step | Edit range |

## 6. THICC.FITT — VAULT / CARDIO / RECOVERY

| Field | Proposed control | Tentative source/range | CLOCK.IT behavior |
|---|---|---|---|
| Compound | Editable list | Use full supplied `roidCompound` list | Add, rename, reorder, disable |
| Ester / Form | Editable list | Use full supplied `roidEster` list | Add, rename, reorder, disable |
| Amount | Two typed editable lists | CC: supplied `.5 CC`–`1.5 CC`; MG: separately administered MG values | Store CC and MG as distinct typed units |
| Sensitivity | Editable list | Use supplied `roidSensitivity` list | Wire field into visible Vault UI |
| Cardio Type | Editable list | Use full supplied cardio list | Add, rename, reorder, disable |
| Cardio Duration | Editable duration list | 10/20/30/45/60/90/120 MIN | Add/reorder; normalize minutes |
| Cardio Intensity | Editable list | LOW, MODERATE, HIGH, HIIT, ZONE 2, ALL OUT, RECOVERY | Add, rename, reorder, disable |
| Cardio Location | Free text + suggestion history | Previously used locations | Select or type |
| Weekly Cardio Goal — Sessions | Numeric wheel | 0–14; step 1 | Edit range |
| Weekly Cardio Goal — Minutes | Numeric wheel | 0–1,000; step 5 | Edit range |
| Sleep Quality | Editable list | ROUGH, LIGHT, OKAY, GOOD, DEEP, RESTORATIVE | Add, rename, reorder, disable |
| So How You Doin | Editable list | Existing 20-item live list | Add, rename, reorder, disable |
| Caffeine | Numeric wheel | 0–1,500 mg; 5-mg step | Edit range |

Note: the old code contains Core and Stage Call option registries/state that are not currently rendered as complete live controls. They should remain in the CLOCK.IT backlog until those THICC.FITT panels are restored or intentionally removed.

## 7. THICC.FITT — BODY RECEIPTS

| Field | Proposed control | Tentative source/range | CLOCK.IT behavior |
|---|---|---|---|
| Body Weight | Numeric wheel | 120–400 lb; step 1 lb | Shared weight configuration if desired |
| Body Fat | Numeric wheel | 1–60%; step 0.1% | Edit range |
| Chest | Numeric wheel | 20–80 in; step 0.25 in | Edit range |
| Waist | Numeric wheel | 20–80 in; step 0.25 in | Edit range |
| Arms L/R | Numeric wheel | 8–40 in; step 0.25 in | Edit range |
| Thighs L/R | Numeric wheel | 12–50 in; step 0.25 in | Edit range |
| Glutes | Numeric wheel | 20–80 in; step 0.25 in | Edit range |

Today, Last Week, and Change should use the same measurement definition. Change should normally be calculated, not selected manually.

## 8. DA.EATER

| Field | Proposed control | Tentative source/range | CLOCK.IT behavior |
|---|---|---|---|
| Meal Type | Editable list | Existing 11 meal types | Add, rename, reorder, disable |
| Supplement Type | Editable list | Existing 9 supplement types | Add, rename, reorder, disable |
| Supplement Unit | Editable list | MG, G, MCG, ML, OZ, SCOOP, CAPSULE, TABLET, SERVING, PACKET, DROP | Add, rename, reorder, disable |
| Treat/Flex Type | Editable list | Existing 8 cheat/flex types | Add, rename, reorder, disable |
| THICC.TREAT Day | Editable weekday list | Current WEDNESDAY, SATURDAY | Add/remove eligible weekdays |
| Craving Intensity | Numeric wheel or editable scale | 1–10 recommended | Edit range/labels |
| Craving Trigger | Editable list + custom | STRESS, BOREDOM, HUNGER, HABIT, SOCIAL, EMOTIONAL, SEEING/SMELLING FOOD, OTHER | Add/edit; allow custom |
| Craving Response | Editable list + custom | HAD IT, DELAYED, SWAPPED, PORTIONED, PASSED, OTHER | Add/edit; allow custom |
| Worth It % | Numeric wheel | 0–100%; step 5% | Edit step |
| Rough Calories | Numeric wheel | 0–10,000 cal; step 50 | Edit range |
| Protein / Carbs / Fats | Numeric wheels | 0–500 g; step 1 g | Edit range |
| Calories | Numeric wheel | 0–10,000 cal; step 10 | Edit range |
| Water | Numeric wheel | 0–256 oz; step 1 oz | Edit range |
| Hyperfixation Times This Week | Numeric wheel | 0–21; step 1 | Edit range |

Meal name, supplement name, fixation name, descriptions, and notes should remain free text, with optional suggestion history later.

## 9. REMEMBER.ME

| Field | Proposed control | Tentative source/range | CLOCK.IT behavior |
|---|---|---|---|
| Event Type | Editable list | Use live 18-item event list as starting truth | Add, rename, reorder, disable |
| Standout Type | Editable list | WOW, WTF, PLOT TWIST | Add/edit only if visual/card mapping is also configured |
| Standout Visual | Asset mapping | One front/back treatment per standout type | Must stay paired with type key |
| Time | Native time picker | Clock time | Not a list |
| Location | Free text + suggestion history | Previously used locations | Select or type |

Important: the supplied legacy `psTypes` list and the current live `EVENT_TYPES` list do not match. The live list is richer and should be the starting set; CLOCK.IT can merge missing legacy choices rather than replacing it.

## 10. THE.SUMMATION / HOPEWOOD / 525600

These sections currently consume data rather than asking for many reusable dropdowns.

| Section | Field | Proposed control |
|---|---|---|
| THE.SUMMATION | Visualization style family | Editable list only if Eugene wants user-selectable styles; otherwise automatic |
| HOPEWOOD | Search filter: Mood | Dynamic values drawn only from saved Day Capsules |
| HOPEWOOD | Search filter: Era | Dynamic values drawn only from saved Day Capsules |
| HOPEWOOD | Search filter: Date | Native date picker |
| HOPEWOOD | Search filter: Keyword/Phrase | Free text search |
| HOPEWOOD | Search filter: Source section | Fixed indexed section list |
| 525600 | View/grouping choices | Fixed system choices unless future customization is requested |

## Confirmed Existing Lists That Must Move Under CLOCK.IT

1. Assurer mood.
2. Assurer era.
3. Assurer singleness.
4. Lobito check-in.
5. Remember.Me event types.
6. Remember.Me standout types.
7. THICC.FITT season.
8. THICC.FITT soreness.
9. THICC.FITT workout duration.
10. THICC.FITT prep status.
11. THICC.FITT cardio type.
12. THICC.FITT cardio duration.
13. THICC.FITT compound.
14. THICC.FITT ester/form.
15. THICC.FITT amount.
16. THICC.FITT sensitivity.
17. THICC.FITT sleep quality.
18. THICC.FITT So How You Doin.
19. ITS.GETTING.THICC sex.
20. ITS.GETTING.THICC sexual orientation.
21. ITS.GETTING.THICC activity level.
22. ITS.GETTING.THICC relationship status.
23. ITS.GETTING.THICC client colors.
24. ITS.GETTING.THICC training/rest.
25. ITS.GETTING.THICC program split.
26. DA.EATER meal types.
27. DA.EATER supplement types.
28. DA.EATER supplement units.
29. DA.EATER treat/flex types.
30. DA.EATER eligible THICC.TREAT weekdays.

## Proposed Build Order

### Pass 1 — Registry foundation

- Replace the split `dropdownOptions` and `optionRegistry` sources with one typed CLOCK.IT registry.
- Add stable keys, labels, type metadata, default values, active state, and display order.
- Store overrides in cloud state/Supabase.

### Pass 2 — CLOCK.IT editor

- Section tabs.
- Editable list editor.
- Numeric wheel editor.
- Color editor.
- Quote editor.
- Reset, disable, reorder, and preview.

### Pass 3 — Wire existing live dropdowns

- THE.ASSURER.
- REMEMBER.ME.
- THICC.FITT.
- DA.EATER.
- ITS.GETTING.THICC.
- THICC.TIME.

### Pass 4 — Convert approved plain fields

- ITS current/goal weight.
- Height and age.
- THICC.FITT ledger numbers and measurements.
- DA.EATER macros, craving intensity, calories, water, and percentage.

### Pass 5 — Cloud persistence and full regression

- Verify edits survive sign-out, browser restart, and production deployment.
- Verify disabled values remain readable on old records.
- Verify every consuming section refreshes when CLOCK.IT saves.
- Verify numeric wheels do not corrupt existing string-formatted records.

## Approved Decisions

1. Current Weight and Goal Weight share one `120–400 lb` range with 1-lb steps.
2. Height is displayed as feet and inches.
3. THICC.FITT exercise weight uses 5-lb increments; no 2.5-lb increments.
4. Vault amount supports both CC and MG through separate typed registries.
5. Fixed system choices—including YES/NO, weekdays, PERSONAL/CLIENT, and recurrence types—are displayed in CLOCK.IT as locked and cannot be edited.
6. HOPEWOOD search filters draw only from saved Day Capsule data and are not administered as CLOCK.IT option lists.
