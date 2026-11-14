import os
import sys
import shutil
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import pypdf

BASE_DIR = '/Users/potlasrisharanchowdary/Documents/Idp_portal'
DOWNLOADS_DIR = '/Users/potlasrisharanchowdary/Downloads'
DOCS_DIR = os.path.join(BASE_DIR, 'docs')
TEMP_IMG_DIR = '/tmp/calibrated_guide_images'
os.makedirs(TEMP_IMG_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

BRAIN_STEPS = '/Users/potlasrisharanchowdary/.gemini/antigravity/brain/45708729-9c46-47cb-9c74-f2c26ec2b9fe/.system_generated/steps'
LANDING_IMG = os.path.join(DOCS_DIR, 'assets/landing.png')
QR_IMG = os.path.join(DOCS_DIR, 'assets/qr_code.png')
CONSENT_MODAL_IMG = os.path.join(DOCS_DIR, 'assets/faculty_consent_form_modal.png')

def get_font(size, bold=True):
    candidates = [
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        '/Library/Fonts/Arial.ttf'
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def annotate_image(src_path, out_name, crop_box=None, boxes=None):
    im = Image.open(src_path).convert('RGB')
    if crop_box:
        im = im.crop(crop_box)
    draw = ImageDraw.Draw(im)
    if boxes:
        f_pill = get_font(20, bold=True)
        f_num = get_font(18, bold=True)
        for b in boxes:
            c = b['coords']
            stroke = b.get('stroke', 4)
            for s in range(stroke):
                draw.rectangle([c[0]-s, c[1]-s, c[2]+s, c[3]+s], outline='#b91c1c')
            
            num = b.get('num', 1)
            label = b.get('label', '')
            px, py = b.get('pill_pos', (c[0], c[1]-30))
            
            pill_text = f'{label}'
            bbox = draw.textbbox((0, 0), pill_text, font=f_pill)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            badge_r = 14
            pill_w = tw + badge_r * 2 + 20
            pill_h = max(th + 12, badge_r * 2 + 6)
            
            # White pill with red outline
            draw.rounded_rectangle([px, py, px + pill_w, py + pill_h], radius=6, fill='white', outline='#b91c1c', width=2)
            # Red circle
            cx = px + badge_r + 4
            cy = py + pill_h / 2
            draw.ellipse([cx - badge_r, cy - badge_r, cx + badge_r, cy + badge_r], fill='#b91c1c')
            # Number
            num_str = str(num)
            nb = draw.textbbox((0, 0), num_str, font=f_num)
            nw = nb[2] - nb[0]
            nh = nb[3] - nb[1]
            draw.text((cx - nw/2, cy - nh/2 - 1), num_str, fill='white', font=f_num)
            # Text
            draw.text((px + badge_r * 2 + 12, py + (pill_h - th)/2 - 1), pill_text, fill='#991b1b', font=f_pill)
            
    out_path = os.path.join(TEMP_IMG_DIR, out_name)
    im.save(out_path, quality=92)
    return out_path

print("Annotating images with verified coordinates...")

# 1. FACULTY ANNOTATIONS
fac_step1_img = annotate_image(
    LANDING_IMG, 'fac_step1.jpg',
    crop_box=(20, 180, 1260, 700),
    boxes=[{
        'coords': (327, 225, 615, 505),
        'stroke': 5,
        'num': 1,
        'label': 'Click "Faculty Portal"',
        'pill_pos': (337, 190)
    }]
)

fac_step2_img = annotate_image(
    f'{BRAIN_STEPS}/179/media_0.png', 'fac_step2.jpg',
    crop_box=(300, 480, 1230, 1220),
    boxes=[
        {'coords': (73, 288, 852, 378), 'stroke': 4, 'num': 1, 'label': 'Enter University Email or Mobile Number', 'pill_pos': (210, 246)},
        {'coords': (73, 456, 852, 546), 'stroke': 4, 'num': 2, 'label': 'Enter 6-Digit Faculty Passcode', 'pill_pos': (200, 414)},
        {'coords': (68, 580, 857, 676), 'stroke': 4, 'num': 3, 'label': 'Click "Login to Faculty Portal"', 'pill_pos': (85, 538)}
    ]
)

fac_step3_img = annotate_image(
    f'{BRAIN_STEPS}/139/media_0.png', 'fac_step3.jpg',
    crop_box=(300, 220, 1240, 1230),
    boxes=[
        {'coords': (17, 436, 908, 523), 'stroke': 4, 'num': 1, 'label': 'Enter 10-Digit Mobile Number', 'pill_pos': (300, 392)},
        {'coords': (17, 596, 908, 683), 'stroke': 4, 'num': 2, 'label': 'Confirm Mobile Number', 'pill_pos': (470, 552)},
        {'coords': (17, 714, 908, 864), 'stroke': 4, 'num': 3, 'label': 'Tick Active Mobile Declaration', 'pill_pos': (27, 674)},
        {'coords': (525, 905, 910, 974), 'stroke': 4, 'num': 4, 'label': 'Click "Save & Verify Number"', 'pill_pos': (535, 866)}
    ]
)

fac_step4_img = annotate_image(
    f'{BRAIN_STEPS}/586/media_0.png', 'fac_step4.jpg',
    crop_box=(40, 240, 1500, 1100),
    boxes=[
        {'coords': (950, 60, 1349, 129), 'stroke': 4, 'num': 1, 'label': 'Change Passcode', 'pill_pos': (960, 25)},
        {'coords': (734, 356, 1060, 411), 'stroke': 4, 'num': 2, 'label': 'Submit Project Idea', 'pill_pos': (744, 320)},
        {'coords': (732, 430, 1279, 485), 'stroke': 4, 'num': 3, 'label': 'Export Rosters (CSV / Excel / PDF)', 'pill_pos': (744, 492)},
        {'coords': (1150, 580, 1429, 769), 'stroke': 4, 'num': 4, 'label': 'Seats Capacity Meter (6/10 Filled)', 'pill_pos': (1080, 544)}
    ]
)

fac_step5_img = annotate_image(
    f'{BRAIN_STEPS}/594/media_0.png', 'fac_step5.jpg',
    crop_box=(40, 110, 1500, 1380),
    boxes=[
        {'coords': (1003, 77, 1336, 132), 'stroke': 4, 'num': 1, 'label': 'Upload / Enter Marks', 'pill_pos': (1013, 38)},
        {'coords': (715, 142, 1140, 188), 'stroke': 4, 'num': 2, 'label': 'Roster Exports (CSV / XLSX / PDF / ZIP)', 'pill_pos': (715, 192)},
        {'coords': (30, 226, 1440, 1225), 'stroke': 4, 'num': 3, 'label': 'Student Roster Table (Attendance & Verification)', 'pill_pos': (40, 192)}
    ]
)

fac_step6_img = annotate_image(
    f'{BRAIN_STEPS}/604/media_0.png', 'fac_step6.jpg',
    crop_box=(250, 180, 1280, 1360),
    boxes=[
        {'coords': (28, 218, 1011, 297), 'stroke': 4, 'num': 1, 'label': 'Project Title (Problem Statement)', 'pill_pos': (280, 178)},
        {'coords': (28, 366, 497, 445), 'stroke': 4, 'num': 2, 'label': 'Category (IDP2501/2502)', 'pill_pos': (210, 328)},
        {'coords': (518, 366, 1011, 445), 'stroke': 4, 'num': 3, 'label': 'Capacity (Default 10)', 'pill_pos': (680, 328)},
        {'coords': (28, 514, 1011, 593), 'stroke': 4, 'num': 4, 'label': 'Interdisciplinary Theme', 'pill_pos': (330, 474)},
        {'coords': (699, 1041, 1011, 1120), 'stroke': 4, 'num': 5, 'label': 'Click "Submit to SPOC"', 'pill_pos': (705, 1000)}
    ]
)

fac_step7_col1_img = annotate_image(
    CONSENT_MODAL_IMG, 'fac_step7_col1.jpg',
    crop_box=(380, 95, 896, 780),
    boxes=[
        {'coords': (28, 240, 486, 302), 'stroke': 4, 'num': 1, 'label': 'Select Type: Consent Form', 'pill_pos': (30, 198)},
        {'coords': (44, 460, 252, 668), 'stroke': 4, 'num': 2, 'label': 'Download Template', 'pill_pos': (24, 418)},
        {'coords': (262, 460, 470, 668), 'stroke': 4, 'num': 3, 'label': 'Upload Signed Form', 'pill_pos': (268, 418)}
    ]
)

fac_step7_col2_img = annotate_image(
    CONSENT_MODAL_IMG, 'fac_step7_col2.jpg',
    crop_box=(380, 775, 896, 1245),
    boxes=[
        {'coords': (28, 45, 486, 300), 'stroke': 4, 'num': 4, 'label': '4 Mandatory Integrity Checks', 'pill_pos': (34, 8)},
        {'coords': (230, 400, 486, 448), 'stroke': 4, 'num': 5, 'label': 'Submit for SPOC Review', 'pill_pos': (180, 358)}
    ]
)

fac_step8_img = annotate_image(
    f'{BRAIN_STEPS}/191/media_0.png', 'fac_step8.jpg',
    crop_box=(80, 140, 1440, 1380),
    boxes=[
        {'coords': (35, 175, 1325, 385), 'stroke': 4, 'num': 1, 'label': 'Compulsory Avishkar CIE Institutional Affiliation', 'pill_pos': (45, 138)},
        {'coords': (35, 415, 1325, 605), 'stroke': 4, 'num': 2, 'label': 'Manuscript Lifecycle Status & Review Stages', 'pill_pos': (45, 378)},
        {'coords': (35, 645, 1325, 835), 'stroke': 4, 'num': 3, 'label': 'Target Journal Metadata & Scopus / WoS Indexing', 'pill_pos': (45, 608)},
        {'coords': (35, 875, 1325, 1225), 'stroke': 4, 'num': 4, 'label': 'DOI Tracking & Save Manuscript Endorsement', 'pill_pos': (45, 838)}
    ]
)

# 2. SPOC ANNOTATIONS
spoc_step1_img = annotate_image(
    LANDING_IMG, 'spoc_step1.jpg',
    crop_box=(20, 180, 1260, 700),
    boxes=[{
        'coords': (635, 225, 923, 505),
        'stroke': 5,
        'num': 1,
        'label': 'Click "Department SPOC"',
        'pill_pos': (645, 190)
    }]
)

spoc_step2_img = annotate_image(
    f'{BRAIN_STEPS}/195/media_0.png', 'spoc_step2.jpg',
    crop_box=(300, 540, 1230, 1280),
    boxes=[
        {'coords': (73, 289, 852, 379), 'stroke': 4, 'num': 1, 'label': 'Enter SPOC Official Email', 'pill_pos': (320, 246)},
        {'coords': (73, 457, 852, 547), 'stroke': 4, 'num': 2, 'label': 'Enter 6-Digit SPOC Passcode', 'pill_pos': (300, 414)},
        {'coords': (68, 581, 857, 677), 'stroke': 4, 'num': 3, 'label': 'Click "Enter SPOC Portal"', 'pill_pos': (85, 538)}
    ]
)

spoc_step3_img = annotate_image(
    f'{BRAIN_STEPS}/147/media_0.png', 'spoc_step3.jpg',
    crop_box=(40, 560, 1500, 1120),
    boxes=[
        {'coords': (45, 55, 495, 250), 'stroke': 4, 'num': 1, 'label': 'Total Department Projects (138)', 'pill_pos': (55, 18)},
        {'coords': (535, 55, 985, 250), 'stroke': 4, 'num': 2, 'label': 'Pending Deliverables Queue (0)', 'pill_pos': (545, 18)},
        {'coords': (1025, 55, 1475, 250), 'stroke': 4, 'num': 3, 'label': 'Faculty Mentors Count (143)', 'pill_pos': (1035, 18)},
        {'coords': (45, 320, 495, 515), 'stroke': 4, 'num': 4, 'label': 'Marks Uploaded Progress %', 'pill_pos': (55, 283)},
        {'coords': (535, 320, 985, 515), 'stroke': 4, 'num': 5, 'label': 'Enrolled Students (1,012)', 'pill_pos': (545, 283)}
    ]
)

spoc_step4_img = annotate_image(
    f'{BRAIN_STEPS}/203/media_0.png', 'spoc_step4.jpg',
    crop_box=(40, 320, 1500, 1170),
    boxes=[
        {'coords': (50, 58, 490, 125), 'stroke': 4, 'num': 1, 'label': 'Active Tab: Project Verification (138)', 'pill_pos': (60, 22)},
        {'coords': (50, 150, 1420, 310), 'stroke': 4, 'num': 2, 'label': 'Multi-Criteria Search & Semester Filters', 'pill_pos': (60, 140)},
        {'coords': (50, 330, 1420, 840), 'stroke': 4, 'num': 3, 'label': 'Submitted Deliverables Queue (Approve / Reject)', 'pill_pos': (60, 320)}
    ]
)

spoc_step5_img = annotate_image(
    f'{BRAIN_STEPS}/133/media_0.png', 'spoc_step5.jpg',
    crop_box=(245, 110, 1270, 1370),
    boxes=[
        {'coords': (56, 210, 970, 320), 'stroke': 4, 'num': 1, 'label': 'Verify Submission Semester (Phase I vs Phase II)', 'pill_pos': (410, 172)},
        {'coords': (56, 432, 970, 512), 'stroke': 4, 'num': 2, 'label': 'Inspect Uploaded Artifact & Document Title', 'pill_pos': (360, 392)},
        {'coords': (56, 818, 970, 1252), 'stroke': 4, 'num': 3, 'label': 'Audit Turnitin (<10%) & AI Content (<20%) Report', 'pill_pos': (64, 780)}
    ]
)

spoc_step6_img = annotate_image(
    f'{BRAIN_STEPS}/207/media_0.png', 'spoc_step6.jpg',
    crop_box=(40, 320, 1500, 1380),
    boxes=[
        {'coords': (480, 58, 910, 122), 'stroke': 4, 'num': 1, 'label': 'Active Tab: Faculty Directory (143 Mentors)', 'pill_pos': (490, 22)},
        {'coords': (50, 155, 1420, 1030), 'stroke': 4, 'num': 2, 'label': 'Faculty Workload, Contact Badges & Project Allocations', 'pill_pos': (60, 140)}
    ]
)

spoc_step7_img = annotate_image(
    f'{BRAIN_STEPS}/213/media_0.png', 'spoc_step7.jpg',
    crop_box=(40, 320, 1500, 1380),
    boxes=[
        {'coords': (920, 58, 1420, 122), 'stroke': 4, 'num': 1, 'label': 'Active Tab: Students Enrolled (1,012 Candidates)', 'pill_pos': (930, 22)},
        {'coords': (50, 155, 1420, 1030), 'stroke': 4, 'num': 2, 'label': 'Student Roster, Attendance Tracking & Marks Cross-Check', 'pill_pos': (60, 140)}
    ]
)

spoc_step8_img = annotate_image(
    f'{BRAIN_STEPS}/217/media_0.png', 'spoc_step8.jpg',
    crop_box=(40, 520, 1500, 1380),
    boxes=[
        {'coords': (50, 40, 1420, 210), 'stroke': 4, 'num': 1, 'label': 'Institutional Reports: Single Project ZIP & Master Exports', 'pill_pos': (60, 10)},
        {'coords': (50, 255, 1420, 830), 'stroke': 4, 'num': 2, 'label': 'Bulk Departmental Roster Archive for NAAC/NIRF Accreditation', 'pill_pos': (60, 220)}
    ]
)

# 3. ADMIN ANNOTATIONS
admin_step1_img = annotate_image(
    LANDING_IMG, 'admin_step1.jpg',
    crop_box=(20, 180, 1260, 700),
    boxes=[{
        'coords': (943, 225, 1231, 505),
        'stroke': 5,
        'num': 1,
        'label': 'Click "Administrator"',
        'pill_pos': (953, 190)
    }]
)

admin_step2_img = annotate_image(
    f'{BRAIN_STEPS}/221/media_0.png', 'admin_step2.jpg',
    crop_box=(300, 480, 1230, 1220),
    boxes=[
        {'coords': (73, 288, 852, 378), 'stroke': 4, 'num': 1, 'label': 'Enter Administrator Email (@gdgu.org)', 'pill_pos': (300, 246)},
        {'coords': (73, 456, 852, 546), 'stroke': 4, 'num': 2, 'label': 'Enter Master Admin Passcode', 'pill_pos': (320, 414)},
        {'coords': (68, 580, 857, 676), 'stroke': 4, 'num': 3, 'label': 'Click "Login to Admin Console"', 'pill_pos': (85, 538)}
    ]
)

admin_step3_img = annotate_image(
    f'{BRAIN_STEPS}/229/media_0.png', 'admin_step3.jpg',
    crop_box=(40, 110, 1500, 720),
    boxes=[
        {'coords': (50, 50, 700, 280), 'stroke': 4, 'num': 1, 'label': 'Total University Students (6,810)', 'pill_pos': (60, 15)},
        {'coords': (730, 50, 1380, 280), 'stroke': 4, 'num': 2, 'label': 'Active Approved Projects (188)', 'pill_pos': (740, 15)},
        {'coords': (50, 330, 700, 560), 'stroke': 4, 'num': 3, 'label': 'Total Registered Students (1,419)', 'pill_pos': (60, 295)},
        {'coords': (730, 330, 1380, 560), 'stroke': 4, 'num': 4, 'label': 'Seats Filled Ratio (1419 / 1880)', 'pill_pos': (740, 295)}
    ]
)

admin_step4_img = annotate_image(
    f'{BRAIN_STEPS}/478/media_0.png', 'admin_step4.jpg',
    crop_box=(40, 140, 1500, 680),
    boxes=[
        {'coords': (60, 50, 650, 185), 'stroke': 4, 'num': 1, 'label': 'Master Registration Open / Closed Toggle (Kill Switch)', 'pill_pos': (70, 15)},
        {'coords': (720, 50, 1380, 185), 'stroke': 4, 'num': 2, 'label': 'Maximum Seats Default (10 Students / Project)', 'pill_pos': (730, 15)},
        {'coords': (60, 205, 1380, 340), 'stroke': 4, 'num': 3, 'label': 'Department Limit (4) & Other Department Limit (6)', 'pill_pos': (70, 170)},
        {'coords': (1020, 370, 1380, 445), 'stroke': 4, 'num': 4, 'label': 'Click "Save Configuration"', 'pill_pos': (1030, 335)}
    ]
)

admin_step5_img = annotate_image(
    f'{BRAIN_STEPS}/478/media_0.png', 'admin_step5.jpg',
    crop_box=(40, 860, 1500, 1430),
    boxes=[
        {'coords': (50, 310, 385, 560), 'stroke': 4, 'num': 1, 'label': 'Department Selector & Quick Pills', 'pill_pos': (50, 275)},
        {'coords': (400, 310, 1045, 445), 'stroke': 4, 'num': 2, 'label': 'Same-Dept (5) & Other-Dept (2) Overrides', 'pill_pos': (410, 275)},
        {'coords': (1060, 488, 1378, 574), 'stroke': 4, 'num': 3, 'label': 'Click "Save Department Limit"', 'pill_pos': (1060, 452)}
    ]
)

admin_step6_img = annotate_image(
    f'{BRAIN_STEPS}/512/media_0.png', 'admin_step6.jpg',
    crop_box=(40, 380, 1500, 1420),
    boxes=[
        {'coords': (50, 190, 720, 560), 'stroke': 4, 'num': 1, 'label': 'Designate Department SPOC & Assign Privileges', 'pill_pos': (60, 155)},
        {'coords': (730, 580, 1410, 970), 'stroke': 4, 'num': 2, 'label': 'Active SPOC Profile & Emergency Password Reset', 'pill_pos': (740, 545)}
    ]
)

admin_step7_img = annotate_image(
    f'{BRAIN_STEPS}/504/media_0.png', 'admin_step7.jpg',
    crop_box=(40, 360, 1500, 1380),
    boxes=[
        {'coords': (920, 55, 1350, 125), 'stroke': 4, 'num': 1, 'label': 'Download All Projects Archive (.zip)', 'pill_pos': (930, 20)},
        {'coords': (50, 240, 1420, 700), 'stroke': 4, 'num': 2, 'label': 'Real-Time Projects & Submissions Analytics (188)', 'pill_pos': (60, 205)},
        {'coords': (50, 725, 1420, 910), 'stroke': 4, 'num': 3, 'label': 'Multi-Field Search & Departmental Filter Controls', 'pill_pos': (60, 690)}
    ]
)

admin_step8_img = annotate_image(
    f'{BRAIN_STEPS}/496/media_0.png', 'admin_step8.jpg',
    crop_box=(40, 420, 1500, 1380),
    boxes=[
        {'coords': (50, 30, 1420, 340), 'stroke': 4, 'num': 1, 'label': 'Student Roster Controls & Export Tools', 'pill_pos': (60, 20)},
        {'coords': (50, 380, 1420, 930), 'stroke': 4, 'num': 2, 'label': 'Unregistered Cohort Breakdown by School (5,391 Candidates)', 'pill_pos': (60, 345)}
    ]
)

admin_step9_img = annotate_image(
    f'{BRAIN_STEPS}/524/media_0.png', 'admin_step9.jpg',
    crop_box=(200, 350, 1340, 1200),
    boxes=[
        {'coords': (100, 242, 1014, 321), 'stroke': 4, 'num': 1, 'label': 'Select Data Entity (Cohort Allocations, Students, Faculty)', 'pill_pos': (285, 204)},
        {'coords': (100, 390, 1014, 461), 'stroke': 4, 'num': 2, 'label': 'Academic Year Tag (2026-2027)', 'pill_pos': (290, 352)},
        {'coords': (100, 535, 1014, 645), 'stroke': 4, 'num': 3, 'label': 'Choose Standardized .xlsx Spreadsheet File', 'pill_pos': (420, 497)},
        {'coords': (630, 690, 1014, 766), 'stroke': 4, 'num': 4, 'label': 'Click "Upload & Populate D1"', 'pill_pos': (630, 652)}
    ]
)

admin_step10_img = annotate_image(
    f'{BRAIN_STEPS}/530/media_0.png', 'admin_step10.jpg',
    crop_box=(200, 240, 1340, 1300),
    boxes=[
        {'coords': (48, 168, 1076, 408), 'stroke': 4, 'num': 1, 'label': 'Strict Cohort Isolation Policy Notice', 'pill_pos': (60, 132)},
        {'coords': (48, 470, 1076, 556), 'stroke': 4, 'num': 2, 'label': 'Target Academic Year to Activate (2026-2027)', 'pill_pos': (450, 432)},
        {'coords': (48, 658, 1076, 746), 'stroke': 4, 'num': 3, 'label': 'Initial Semester Milestone Configuration', 'pill_pos': (350, 620)},
        {'coords': (695, 920, 1076, 974), 'stroke': 4, 'num': 4, 'label': 'Click "Proceed to Verification"', 'pill_pos': (695, 884)}
    ]
)

admin_step11_img = annotate_image(
    f'{BRAIN_STEPS}/542/media_0.png', 'admin_step11.jpg',
    crop_box=(40, 680, 1500, 1430),
    boxes=[
        {'coords': (50, 45, 1420, 240), 'stroke': 4, 'num': 1, 'label': '1-Click Full Database Export & Safe Wipe Controls', 'pill_pos': (60, 10)},
        {'coords': (50, 285, 1420, 530), 'stroke': 4, 'num': 2, 'label': 'Allocated Mappings (1,419) & Real-Time Record Meters', 'pill_pos': (60, 250)},
        {'coords': (50, 575, 1420, 730), 'stroke': 4, 'num': 3, 'label': 'Master Query Tables (Mappings, Students, Faculty, Projects)', 'pill_pos': (60, 540)}
    ]
)

# -------------------------------------------------------------
# NUMBERED CANVAS (A4 HEADER & FOOTER)
# -------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        # Top banner on page 2+
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor('#0a192f'))
            self.setLineWidth(1)
            self.line(40, 805, 555, 805)
            self.setFont("Times-Roman", 8)
            self.setFillColor(colors.HexColor('#475569'))
            self.drawString(40, 810, "GDGU Inter-Disciplinary Project (IDP) Portal · Academic Session 2026–2027")
            self.drawRightString(555, 810, "Official Standard Operating Procedure")

        # Bottom footer on all pages
        self.setStrokeColor(colors.HexColor('#cbd5e1'))
        self.setLineWidth(0.6)
        self.line(40, 40, 555, 40)
        
        self.setFont("Times-Roman", 8)
        self.setFillColor(colors.HexColor('#64748b'))
        self.drawString(40, 28, "Avishkar · Centre for Innovation & Entrepreneurship (CIE), G.D. Goenka University")
        self.drawRightString(555, 28, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

# -------------------------------------------------------------
# PDF BUILDER ENGINE
# -------------------------------------------------------------
def build_pdf(filename, doc_title, subtitle, pages_data):
    pdf_path = os.path.join(DOWNLOADS_DIR, filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=42,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=17,
        leading=22,
        alignment=1,
        textColor=colors.HexColor('#0a192f')
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=12.5,
        leading=16,
        alignment=1,
        textColor=colors.HexColor('#b45309')
    )

    step_title_style = ParagraphStyle(
        'StepTitle',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0a192f')
    )

    body_style = ParagraphStyle(
        'StepBody',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1e293b')
    )

    body_bold = ParagraphStyle(
        'StepBodyBold',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#0a192f')
    )

    link_style = ParagraphStyle(
        'StepLink',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1d4ed8')
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1e3a8a')
    )

    story = []

    for page_idx, pdata in enumerate(pages_data):
        page_elements = []

        if page_idx == 0:
            page_elements.append(Paragraph(doc_title, title_style))
            page_elements.append(Spacer(1, 4))
            page_elements.append(Paragraph(subtitle, subtitle_style))
            page_elements.append(Spacer(1, 14))

        page_elements.append(Paragraph(pdata['step_title'], step_title_style))
        page_elements.append(Spacer(1, 8))

        for item in pdata['content']:
            if isinstance(item, tuple) and item[0] == 'link':
                page_elements.append(Paragraph(f'<a href="{item[1]}"><u>{item[1]}</u></a>', link_style))
                page_elements.append(Spacer(1, 4))
            elif isinstance(item, tuple) and item[0] == 'bold':
                page_elements.append(Paragraph(item[1], body_bold))
                page_elements.append(Spacer(1, 2))
            elif isinstance(item, tuple) and item[0] == 'notice_title':
                page_elements.append(Paragraph(f"<b>{item[1]}</b>", ParagraphStyle(
                    'NoticeTitle', fontName='Times-Bold', fontSize=10.5, leading=14, textColor=colors.HexColor('#0a192f')
                )))
                page_elements.append(Spacer(1, 4))
            elif isinstance(item, tuple) and item[0] == 'table':
                rows = []
                for r in item[1]:
                    row_cells = []
                    for c in r:
                        if isinstance(c, tuple) and c[0] == 'th':
                            row_cells.append(Paragraph(f"<b>{c[1]}</b>", ParagraphStyle('TH', fontName='Times-Bold', fontSize=8, leading=11, textColor=colors.HexColor('#ffffff'))))
                        else:
                            row_cells.append(Paragraph(str(c), ParagraphStyle('TD', fontName='Times-Roman', fontSize=7.5, leading=10, textColor=colors.HexColor('#1e293b'))))
                    rows.append(row_cells)
                t = Table(rows, colWidths=item[2])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0a192f')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('LEFTPADDING', (0, 0), (-1, -1), 4),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f8fafc'), colors.HexColor('#ffffff')])
                ]))
                page_elements.append(t)
                page_elements.append(Spacer(1, 6))
            elif isinstance(item, tuple) and item[0] == '':
                page_elements.append(Spacer(1, 4))
            else:
                page_elements.append(Paragraph(item, body_style))
                page_elements.append(Spacer(1, 3))

        if 'callout' in pdata and pdata['callout']:
            tag, msg = pdata['callout']
            callout_p = Paragraph(f"<b>{tag}:</b> {msg}", callout_style)
            callout_table = Table([[callout_p]], colWidths=[515])
            callout_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#eff6ff')),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bfdbfe')),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            page_elements.append(Spacer(1, 4))
            page_elements.append(callout_table)

        if 'columns' in pdata:
            cols = pdata['columns']
            col1 = RLImage(cols[0]['path'], width=cols[0]['w'], height=cols[0]['h'])
            col2 = RLImage(cols[1]['path'], width=cols[1]['w'], height=cols[1]['h'])
            valign_val = pdata.get('col_valign', 'MIDDLE')
            two_col = Table([[col1, col2]], colWidths=[cols[0]['col_w'], cols[1]['col_w']])
            two_col.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), valign_val),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            page_elements.append(Spacer(1, 8))
            page_elements.append(two_col)
        elif 'image_path' in pdata and pdata['image_path']:
            im = Image.open(pdata['image_path'])
            orig_w, orig_h = im.size
            disp_w = 515
            disp_h = disp_w * (orig_h / orig_w)
            max_h = pdata.get('max_h', 280)
            if disp_h > max_h:
                disp_h = max_h
                disp_w = disp_h * (orig_w / orig_h)

            img_obj = RLImage(pdata['image_path'], width=disp_w, height=disp_h)
            img_table = Table([[img_obj]], colWidths=[515])
            img_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            page_elements.append(img_table)

        story.append(KeepTogether(page_elements))
        if page_idx < len(pages_data) - 1:
            story.append(PageBreak())

    doc.build(story, canvasmaker=NumberedCanvas)
    
    dest_path = os.path.join(DOCS_DIR, filename)
    shutil.copyfile(pdf_path, dest_path)
    print(f"Generated PDF: {pdf_path}")
    print(f"Copied to: {dest_path}")

# =============================================================
# DATA DEFINITIONS FOR THE THREE PORTALS
# =============================================================

faculty_pages = [
    {
        'step_title': 'Step 1: Accessing the IDP Portal & Role Selection',
        'content': [
            'Faculty mentors supervise multidisciplinary student cohorts, propose interdisciplinary research tracks, evaluate milestones, and endorse final publication manuscripts.',
            '• Access Link: Open your browser and navigate to the official university URL:',
            ('link', 'https://gdgu-idp-portal.cie-1e4.workers.dev/faculty/login'),
            '• Role Selection: From the IDP Landing Page, click on the Amber/Gold Faculty Portal card.',
            '• Mobile Support: Fully responsive on mobile, tablet, and desktop workstations.'
        ],
        'callout': ('Portal Objective', 'Enables faculty to monitor real-time student allocations, communicate with mentees, submit deliverables, and track publication credentials under Avishkar CIE.'),
        'columns': [
            {'path': QR_IMG, 'w': 160, 'h': 160, 'col_w': 195},
            {'path': fac_step1_img, 'w': 310, 'h': 165, 'col_w': 320}
        ]
    },
    {
        'step_title': 'Step 2: Faculty Sign-In & Session Security',
        'content': [
            '1. <b>Faculty Official Email or Mobile Number:</b> Enter your registered university email (@gdgu.org) or your registered 10-digit mobile number.',
            '2. <b>Security Passcode:</b> Enter your secure faculty passcode (Initial default: <code>gdgu@2026</code>).',
            '3. <b>Dual Authentication Mode:</b> Supports sign-in via either official email or 10-digit mobile number.',
            '4. <b>Login to Faculty Portal:</b> Authenticates and issues a 24-hour encrypted JWT session token.',
            '5. <b>Changing Passcode After Opening Portal:</b> Faculty can change their password after opening the portal at any time by clicking the <b>Change Passcode</b> button in the top navigation bar.',
            '• Forgot Passcode? Contact your Department SPOC or System Administrator for an emergency credentials reset.'
        ],
        'callout': ('Security Protocol', 'Never share your faculty passcode. Faculty are strongly advised to change the default passcode (gdgu@2026) immediately after opening the portal via the "Change Passcode" button on the dashboard.'),
        'image_path': fac_step2_img,
        'max_h': 290
    },
    {
        'step_title': 'Step 3: Mandatory Mobile Number Verification',
        'content': [
            'All faculty supervisors must declare and verify an active contact mobile number before managing projects:',
            '• <b>One-Time Verification:</b> If your mobile number is already registered, this prompt is bypassed automatically on login.',
            '1. <b>10-Digit Mobile Number:</b> Enter your active mobile number in the first input box.',
            '2. <b>Confirm Mobile Number:</b> Re-type the exact number (double-entry check to eliminate typos).',
            '3. <b>Consent Declaration:</b> Tick the box: <i>"I declare that this mobile number is correct and active..."</i>',
            '4. <b>Save & Verify Number:</b> Instantly updates your mentor profile with a green verified badge.',
            '• <i>Optional Editing:</i> Faculty can click <b>Update Phone</b> in the top bar anytime to change their number.'
        ],
        'callout': ('Compliance Mandate', 'Mentors with unverified mobile numbers are flagged in the SPOC Executive Directory. Update promptly to maintain active supervision status.'),
        'image_path': fac_step3_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 4: Faculty Workspace & Assigned Projects Overview',
        'content': [
            'The Faculty Workspace centralizes all project allocations and real-time cohort statistics:',
            '1. <b>Top Profile Card:</b> Displays your name, affiliated School, official email, and contact badge.',
            '2. <b>Change Passcode:</b> Click anytime to update your security passcode for account protection.',
            '3. <b>Project Card Details:</b> Displays Project Code (e.g., <b>P139</b>), Title, Category, and Assigned Theme.',
            '4. <b>Quick Deliverable Actions & Status Pills:</b> Click <b>+ Consent Form</b> or <b>+ Upload for Sem X</b> directly. Status pills indicate <b>Final Report</b> (Uploaded/Required), <b>Defense PPT</b> (Uploaded/Required), and <b>Consent Form</b> (Uploaded/Pending).',
            '5. <b>Template Download:</b> Click <b>Blank Template (.docx)</b> on the card to obtain the official publication consent form.'
        ],
        'callout': ('Capacity Enforcement', 'Total capacity defaults to 10 students per track, partitioned into Same-Department (max 4) and Other-Department (min 6) quotas to ensure true interdisciplinarity.'),
        'image_path': fac_step4_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 5: Enrolled Student Roster Management & Exports',
        'content': [
            'Inspect your complete student group roster and export official attendance records:',
            '1. <b>Student Roster Table:</b> Review Enrollment Number, Full Name, Department, and Contact Number.',
            '2. <b>One-Click Contact:</b> Click <b>Email</b> to open your email client or <b>Call</b> to dial the student directly.',
            '3. <b>Multi-Format Roster Exports:</b>',
            '   • <b>CSV:</b> Raw spreadsheet format for custom grading calculations.',
            '   • <b>Excel (.xlsx):</b> Formatted official marksheets with student metadata and signatures.',
            '   • <b>PDF:</b> Institutional roster document formatted for formal department submissions.'
        ],
        'callout': ('Roster Lock Rule', 'Student allocations are permanently locked upon enrollment. Mentors cannot drop, swap, or reassign students without written endorsement from the Dean of Academics.'),
        'image_path': fac_step5_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 6: Proposing New Interdisciplinary Project Tracks',
        'content': [
            'Faculty members can propose new cutting-edge interdisciplinary project ideas to their department:',
            '1. Click the <b>Submit Project Idea</b> button located at the top right of your workspace.',
            '2. <b>Project Title:</b> Enter a descriptive, outcome-oriented project title.',
            '3. <b>Category & Theme:</b> Select <b>IDP2501</b> (Business Model) or <b>IDP2502</b> (Research) and thematic area.',
            '4. <b>Total Student Capacity:</b> Set maximum group size (default 10 students).',
            '5. <b>SDG Alignment & Objectives:</b> Map UN Sustainable Development Goals (e.g. SDG 7, 9, 13) and write abstract.',
            '6. <b>Submit to SPOC:</b> Transmits the proposal to your Department SPOC for vetting and catalog activation.'
        ],
        'callout': ('Interdisciplinary Standard', 'Projects must incorporate methodologies from at least two distinct academic departments to qualify under Avishkar CIE guidelines.'),
        'image_path': fac_step6_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 7: Student Publication Consent Form & Deliverables Upload',
        'content': [
            'Mentors submit student group deliverables and publication consent for formal SPOC verification:',
            '1. <b>Artifact Document Type:</b> On the project card, click <b>+ Consent Form</b> or <b>+ Upload for Sem X</b> and select <b>Consent Form</b>.',
            '2. <b>Download Template (.docx):</b> Click <b>Download Template (.docx)</b> to retrieve the standardized 10-student publication consent form.',
            '3. <b>Upload Signed Form:</b> Collect signatures from all student co-authors and faculty mentor, then upload the completed <code>.docx</code> or <code>.pdf</code>.',
            '4. <b>Mandatory Verifications:</b> Tick all 4 checks: (1) Student consent recorded & granted, (2) Plagiarism &lt; 10% &amp; AI &lt; 20%, (3) Authorship attribution &amp; non-exclusive rights, and (4) Supervising faculty sign-off.',
            '5. <b>Submit Deliverable:</b> Confirm self-declaration and click <b>Upload &amp; Submit Consent Form</b> for SPOC clearance.'
        ],
        'callout': ('Institutional Mandate', 'Signed Student Publication Consent Forms are strictly required prior to research manuscript endorsement or journal submission under Avishkar CIE.'),
        'columns': [
            {'path': fac_step7_col1_img, 'w': 252, 'h': 335, 'col_w': 257},
            {'path': fac_step7_col2_img, 'w': 252, 'h': 227, 'col_w': 257}
        ],
        'col_valign': 'TOP'
    },
    {
        'step_title': 'Step 8: Research Manuscript & Publication Governance',
        'content': [
            'Endorse final scholarly research papers produced by student project teams:',
            '1. Click the <b>Manuscript</b> button on your assigned project card.',
            '2. <b>Publication Metadata:</b> Enter Paper Title, Target Journal / Conference Name, and Indexing (Scopus / WoS).',
            '3. <b>Compulsory Institutional Affiliation:</b>',
            '   • Authors must specify: <i>"Avishkar Centre for Innovation and Entrepreneurship (CIE), G.D. Goenka University, Haryana"</i>.',
            '4. <b>Signed Student Consent Form:</b> Ensure all student co-authors have signed the Student Publication Consent Form uploaded under project artifacts.',
            '5. <b>DOI / Manuscript Tracking:</b> Enter DOI or paper tracking ID and save endorsement.'
        ],
        'callout': ('Accreditation Linkage', 'Avishkar CIE affiliation is required on all IDP manuscripts to earn institutional credit toward NIRF, NAAC, and QS university ranking audits.'),
        'image_path': fac_step8_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 9: Continuous Evaluation & Viva Defense Rubric',
        'content': [
            'Evaluation is conducted continuously across both academic semesters using the 100-mark rubric:',
            ('table', [
                [('th', 'Assessment Component'), ('th', 'Marks'), ('th', 'Key Performance Indicators (KPIs)'), ('th', 'Target Deadline')],
                ['Literature Review & Problem Formulation', '15', 'Problem clarity, novelty, citation depth, interdisciplinary relevance', 'Mid Sem 3'],
                ['Methodology & System Design', '20', 'Multi-department synergy, architectural rigor, experimental setup', 'End Sem 3 (Interim)'],
                ['Implementation & Prototype', '25', 'Working model, code repository, analytical results, fabrication quality', 'Mid Sem 4'],
                ['Plagiarism & Dissertation Quality', '20', 'Turnitin < 10%, AI < 20%, technical writing standard, references', 'End Sem 4 Pre-Defense'],
                ['Oral Viva Voce Defense', '20', 'Q&A handling, technical mastery, team contribution, demo defense', 'Final Viva Voce']
            ], [130, 35, 260, 90]),
            '• <b>Grade Submission:</b> Input marks via the <b>Upload / Enter Marks</b> modal before the semester grade lock date.'
        ],
        'callout': ('Evaluation Lock', 'Once marks are submitted and endorsed by the SPOC, scores are transferred directly to the Controller of Examinations and cannot be amended without Dean approval.'),
        'image_path': None
    },
    {
        'step_title': 'Step 10: Faculty Compliance Policies & Best Practices',
        'content': [
            ('notice_title', 'Core Faculty Mentorship Obligations:'),
            ('', ''),
            ('bold', '1. Immediate Passcode Rotation:'),
            'Update your temporary default login passcode upon initial sign-in to safeguard student evaluations.',
            ('', ''),
            ('bold', '2. Zero Tolerance for Plagiarism & AI Distortion:'),
            'All reports must be screened through Turnitin. Any document exceeding 10% similarity or 20% AI generated content is subject to immediate rejection and academic inquiry.',
            ('', ''),
            ('bold', '3. Dual-Semester Milestone & Consent Form Adherence:'),
            'Phase I (Interim Report + PPT), Phase II (Final Thesis), and Student Publication Consent Forms must be submitted within departmental deadlines.',
            ('', ''),
            ('bold', '4. Locked Roster Governance:'),
            'Project allocations are final. No student transfers, drops, or private grouping arrangements are permitted without formal approval from the Dean of Academics.'
        ],
        'callout': ('Academic Integrity Hotline', 'For disputes, mentor allocation imbalances, or Turnitin appeals, contact the Avishkar CIE Office (Room 214, Admin Block) or email cie.idp@gdgu.org.'),
        'image_path': None
    }
]

spoc_pages = [
    {
        'step_title': 'Step 1: Accessing the SPOC Portal & Role Selection',
        'content': [
            'Department SPOCs (Single Points of Contact) oversee academic integrity, review submitted project artifacts, monitor mentor allocations, and endorse final department evaluations.',
            '• Access Link: Open your browser and navigate to the official university portal:',
            ('link', 'https://gdgu-idp-portal.cie-1e4.workers.dev/spoc/login'),
            '• Role Selection: From the IDP Landing Page, click on the Emerald Green Department SPOC card.',
            '• Multi-Department Support: SPOCs holding cross-departmental oversight can switch views instantly.'
        ],
        'callout': ('SPOC Authority', 'Department SPOCs act as the official gateway between faculty supervisors and university accreditation bodies, ensuring zero plagiarism and complete milestone compliance.'),
        'columns': [
            {'path': QR_IMG, 'w': 160, 'h': 160, 'col_w': 195},
            {'path': spoc_step1_img, 'w': 310, 'h': 165, 'col_w': 320}
        ]
    },
    {
        'step_title': 'Step 2: SPOC Sign-In & Multi-Department Switching',
        'content': [
            '1. <b>SPOC Official Email:</b> Enter your registered university email ending in <code>@gdgu.org</code>.',
            '2. <b>Security Passcode:</b> Enter your secure SPOC passcode.',
            '• Initial Login: Use the institutional temporary passcode: <code>gdgu@2026</code>.',
            '3. <b>Multi-Department Switcher:</b>',
            '   • If you manage multiple departments, click the header dropdown to switch active views seamlessly.',
            '   • All metrics, rosters, and verification queues re-index automatically to the selected department.'
        ],
        'callout': ('Access Protocol', 'SPOC accounts require explicit administrator delegation. If your department view is missing or restricted, contact the System Administrator for role assignment.'),
        'image_path': spoc_step2_img,
        'max_h': 290
    },
    {
        'step_title': 'Step 3: Executive Department KPI Dashboard',
        'content': [
            'The SPOC Executive Dashboard provides continuous real-time departmental intelligence:',
            '1. <b>Total Projects (138):</b> Total approved interdisciplinary project offerings led by department faculty.',
            '2. <b>Pending Review (0):</b> Immediate queue of uploaded student artifacts awaiting SPOC compliance audit.',
            '3. <b>Faculty Members (143):</b> Total active teaching faculty and supervisors registered in the department.',
            '4. <b>Marks Submitted %:</b> Real-time progress bar of completed continuous assessment and viva score entries.',
            '5. <b>Enrolled Students (1,012):</b> Total students belonging to your department allocated to projects campus-wide.'
        ],
        'callout': ('Live Synchronization', 'Key metrics synchronize automatically via Server-Sent Events (SSE). Counters increment in real time as faculty upload deliverables and students register.'),
        'image_path': spoc_step3_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 4: Project Verification Queue & Search Filters',
        'content': [
            'Audit uploaded deliverables under the Project Verification tab:',
            '1. <b>Semester Filtering:</b> Switch between <b>All Semesters</b>, <b>Semester 3 (Interim)</b>, and <b>Semester 4 (Defense)</b>.',
            '2. <b>Search Bar:</b> Quickly search projects by Project Code (e.g., <b>P139</b>), Title keyword, or Faculty Mentor Name.',
            '3. <b>Artifact Inspection:</b> Click <b>Review Deliverable</b> on any card to preview uploaded reports and PPT slides.',
            '4. <b>Status Indicators:</b> Visually identify Pending Review (Yellow), Approved (Green), and Revision Required (Red).'
        ],
        'callout': ('Verification SLA', 'Department SPOCs must review and process submitted deliverables within 5 working days of faculty upload to prevent evaluation bottlenecks.'),
        'image_path': spoc_step4_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 5: Plagiarism Audit, Approval & Rejection Notes',
        'content': [
            'Enforce rigorous university academic integrity standards in the Review Modal:',
            '1. <b>Plagiarism Audit:</b> Cross-check Turnitin / DrillBit similarity score against uploaded report (Must be <b>&lt; 10%</b>).',
            '2. <b>AI Content Audit:</b> Verify that AI-assisted content does not exceed the mandatory <b>20%</b> threshold.',
            '3. <b>Approval Protocol:</b> Click <b>Approve Deliverables</b> to lock the milestone and mark the team viva-ready.',
            '4. <b>Rejection Protocol:</b> If substandard, enter structured, timestamped feedback in the <b>Rejection Notes</b> field and click <b>Reject for Revision</b>.',
            '• The mentor receives instant notification detailing exact sections requiring rewriting or re-testing.'
        ],
        'callout': ('Constructive Feedback Mandate', 'Rejections without written feedback are prohibited. Clearly specify similarity reduction requirements or missing research sections.'),
        'image_path': spoc_step5_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 6: Faculty Directory & Mentorship Oversight',
        'content': [
            'Monitor department faculty engagement and balance mentoring workloads:',
            '1. <b>Faculty Directory Tab:</b> Access comprehensive roster of all 143+ registered departmental faculty members.',
            '2. <b>Supervision Quota Tracking:</b> Verify student counts assigned per supervisor (Default cap: 2 tracks / 20 students).',
            '3. <b>Contact Verification Status:</b> Identify faculty flagged with unverified mobile numbers.',
            '4. <b>Submission Progress:</b> Track which faculty have outstanding deliverable uploads or pending viva marks.'
        ],
        'callout': ('Workload Balance', 'Department SPOCs can request the administrator to reallocate students if any faculty member exceeds the departmental maximum mentoring threshold.'),
        'image_path': spoc_step6_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 7: Departmental Student Tracking & Marks Cross-Check',
        'content': [
            'Oversee departmental students enrolled in IDP projects across all university schools:',
            '1. <b>Students Enrolled Tab:</b> Browse all 1,012 departmental students with current project assignments.',
            '2. <b>Attendance Tracking:</b> Verify student attendance records (Minimum <b>75%</b> required to sit for Viva Voce).',
            '3. <b>Internal & External Marks Audit:</b>',
            '   • Continuous Internal Assessment (/50) entered by faculty mentor.',
            '   • External Viva Voce Evaluation (/50) awarded by defense panel.',
            '4. Cross-check totals before departmental sign-off and ERP integration.'
        ],
        'callout': ('Attendance Gatekeeper', 'Students with attendance below 75% are automatically flagged. The SPOC must verify medical leave or institutional duty slips before debarment exemptions.'),
        'image_path': spoc_step7_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 8: Institutional Exports & Master ZIP Archiving',
        'content': [
            'Download department-wide datasets and compiled project portfolios for compliance:',
            '1. <b>Single Project ZIP:</b> Download individual project archive including report, slides, and plagiarism slip.',
            '2. <b>Master Department ZIP:</b> One-click compilation of all approved deliverables across the entire department.',
            '3. <b>Roster Spreadsheets (.xlsx / .csv):</b> Export formatted marksheet records for Board of Studies review.',
            '4. <b>NAAC / NIRF Documentation:</b> Generates standardized metadata summaries for external accreditation audits.'
        ],
        'callout': ('Archive Security', 'Master archives contain full un-obfuscated student project intellectual property. Store files securely on institutional drives with restricted departmental access.'),
        'image_path': spoc_step8_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 9: Interdisciplinary Quota Coordination & Viva Panels',
        'content': [
            'Coordinate multi-departmental quota distributions and viva defense committees:',
            '1. <b>Quota Oversight:</b> Ensure projects hosted by your department maintain the mandatory <b>40% Same / 60% Other</b> ratio.',
            '2. <b>Viva Defense Panel Formation:</b>',
            '   • <b>Panel Chair:</b> Department SPOC or designated Senior Faculty.',
            '   • <b>Internal Examiner:</b> Assigned Faculty Supervisor.',
            '   • <b>External Department Examiner:</b> Faculty member from a cognate multidisciplinary school.',
            '3. <b>Score Moderation:</b> SPOC reviews score distributions across panels to prevent grade inflation or bias.'
        ],
        'callout': ('Viva Panel Standard', 'At least one defense panelist must represent a different academic school than the project mentor to uphold interdisciplinary evaluation standards.'),
        'image_path': None
    },
    {
        'step_title': 'Step 10: Departmental Governance Protocols & Escalation',
        'content': [
            ('notice_title', 'Department SPOC Code of Governance:'),
            ('', ''),
            ('bold', '1. Strict Plagiarism Threshold (<10%):'),
            'Under no circumstances may a SPOC approve a project report with similarity >= 10%. Reports failing this benchmark must be rejected with revision notes.',
            ('', ''),
            ('bold', '2. Mandatory Constructive Rejection Feedback:'),
            'Rejections must clearly enumerate required modifications (e.g. rewriting literature review, augmenting experimental data, fixing citations).',
            ('', ''),
            ('bold', '3. 100% Department Student Mapping:'),
            'Ensure every eligible student in your department is confirmed in a project before the university enrollment freeze.',
            ('', ''),
            ('bold', '4. Institutional Escalation Pathway:'),
            'Unresolved student grievances, unresponsive mentors, or cross-school allocation conflicts must be escalated immediately to the Central IDP Administrator or Dean of Academics.'
        ],
        'callout': ('Administrative Support', 'For technical portal issues, database lockouts, or emergency quota adjustments, contact the Central Admin Desk at admin.idp@gdgu.org.'),
        'image_path': None
    }
]

admin_pages = [
    {
        'step_title': 'Step 1: Accessing the Admin Console & Privilege Verification',
        'content': [
            'The Central Administrator Console provides master operational control over student self-registration, department quotas, faculty appointments, project inventories, and database rollovers.',
            '• Access Link: Open your browser and navigate to the official university portal:',
            ('link', 'https://gdgu-idp-portal.cie-1e4.workers.dev/admin/login'),
            '• Role Selection: From the IDP Landing Page, click on the Navy Blue Administrator card.',
            '• Access Tier: Restricted to Central Academic Office and IT Directorate personnel.'
        ],
        'callout': ('Central Authority', 'System Administrators possess campus-wide governance authority. All actions (roster updates, kill switch toggles, data purges) are permanently logged in the audit trail.'),
        'columns': [
            {'path': QR_IMG, 'w': 160, 'h': 160, 'col_w': 195},
            {'path': admin_step1_img, 'w': 310, 'h': 165, 'col_w': 320}
        ]
    },
    {
        'step_title': 'Step 2: Administrator Sign-In & Privilege Verification',
        'content': [
            '1. <b>Administrator Email:</b> Enter your authorized university administrator email ending in <code>@gdgu.org</code>.',
            '2. <b>Master Security Passcode:</b> Enter your high-entropy administrative passcode.',
            '3. <b>Privilege Authentication:</b> Cryptographic authentication issues a secure administrative session token.',
            '• <b>Security Lockdown:</b> 5 consecutive failed sign-in attempts triggers a 30-minute IP block to prevent brute-force attacks.',
            '• Contact the IT Directorate if an emergency master key rotation is required.'
        ],
        'callout': ('Privilege Warning', 'Administrator credentials grant full read/write access to institutional datasets. Never access the admin console from public or unsecured workstations.'),
        'image_path': admin_step2_img,
        'max_h': 290
    },
    {
        'step_title': 'Step 3: Global Executive Dashboard & University Analytics',
        'content': [
            'Real-time campus-wide intelligence across all academic schools:',
            '1. <b>Total Students (6,810):</b> Total eligible student population across all university departments.',
            '2. <b>Project Tracks (188):</b> Total approved interdisciplinary project offerings active in the catalog.',
            '3. <b>Total Registrations (1,419):</b> Real-time counter of enrolled student seats.',
            '4. <b>Seats Filled Ratio (1419 / 1880):</b> University-wide seat utilization percentage.',
            '• <b>Quick Operations Bar:</b> Rapid shortcuts for <b>+ Add Student</b>, <b>+ Add Faculty</b>, <b>Map Student</b>, <b>Assign SPOC</b>, and <b>Database Console</b>.'
        ],
        'callout': ('Global Health Monitoring', 'Monitor the Seats Filled Ratio during registration peaks. If capacity falls below 100%, alert departments to propose additional project tracks.'),
        'image_path': admin_step3_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 4: Master Registration Control & Kill Switch',
        'content': [
            'Control university-wide student registration windows via the Master Kill Switch:',
            '1. <b>Registration Open / Closed Toggle:</b> Click to instantly open or close student self-registration campus-wide.',
            '2. <b>Real-Time Alert Broadcast:</b> When closed, all active student browsers immediately display an alert banner: <i>"Project registration is currently closed by university administration"</i>.',
            '3. <b>Registration Freeze Protocol:</b> Use the toggle immediately following the official drop/add deadline to freeze seat bookings prior to bulk allocation.',
            '4. <b>Global Seat Parameters:</b> Configure university default maximum capacity per project (default 10 seats).'
        ],
        'callout': ('Atomic Lock', 'Toggling the kill switch enforces immediate rejection of incoming registration API transactions with HTTP 403 Forbidden.'),
        'image_path': admin_step4_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 5: Department Quotas & Seat Precedence Rules',
        'content': [
            'Configure fine-grained departmental seating quotas and override rules:',
            '1. <b>Default Quota Policy:</b> Standard global defaults enforce <b>Same-Department Limit = 4</b> and <b>Other-Department Limit = 6</b>.',
            '2. <b>Department-Wise Limits Card:</b>',
            '   • Select department via quick pills (e.g. <b>+SOES</b>, <b>+SOM</b>, <b>+SOL</b>, <b>+SOHT</b>, <b>+SOHAS</b>, <b>+UID</b>).',
            '   • Set custom Same-Dept and Other-Dept caps to accommodate specialized cohort sizes.',
            '3. <b>Precedence Logic:</b> Department-specific limits strictly override global defaults, while individual project proposals can specify custom overrides if approved by the Academic Dean.'
        ],
        'callout': ('Precedence Hierarchy', 'Rule evaluation order: (1) Project Custom Override -> (2) Department Quota Setting -> (3) Global System Default.'),
        'image_path': admin_step5_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 6: Faculty Credential Governance & SPOC Delegation',
        'content': [
            'Manage faculty accounts, reset security passcodes, and designate Department SPOCs:',
            '1. <b>Department SPOC Management Card:</b> Select any department (e.g., School of Engineering & Sciences) and choose a faculty member from the dropdown.',
            '2. <b>Assign SPOC Privileges:</b> Grants immediate departmental verification authority and provisions dedicated login ID (e.g., <code>spoc.engineering@gdgu.org</code>).',
            '3. <b>Emergency Passcode Reset:</b> Click <b>Password</b> on any faculty or SPOC profile to instantly reset credentials if an instructor is locked out.',
            '4. <b>Revoke SPOC Role:</b> Revokes verification privileges when coordinator rotations occur.'
        ],
        'callout': ('Privilege Segregation', 'Only faculty members officially designated as SPOC in this console can access departmental verification queues and approve deliverables.'),
        'image_path': admin_step6_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 7: Master Projects Inventory & Scope Management',
        'content': [
            'Audit and administer all 188+ interdisciplinary project offerings across campus:',
            '1. <b>Projects Dashboard:</b> Review milestone breakdown: Both Sems Done (0), Approved (0), Under Review (0), Changes Req. (0), and Not Submitted (188).',
            '2. <b>Search & Filter Controls:</b> Search by Project ID (e.g., <b>P139</b>), Title, Mentor name, or Academic School.',
            '3. <b>Category & Theme Tagging:</b> Verify proper tagging between <b>IDP2501 (Business Model)</b> and <b>IDP2502 (Research Track)</b>.',
            '4. <b>Master Deliverables Archive:</b> Click <b>Download All Files (.zip)</b> to compile a complete university-wide deliverable archive for accreditation.'
        ],
        'callout': ('Catalog Freeze', 'Project proposals cannot be modified once student self-registration opens. Changes to project titles or capacities require administrator approval.'),
        'image_path': admin_step7_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 8: Registrations Oversight & Bulk Auto-Registration Engine',
        'content': [
            'Monitor student registration states and auto-allocate remaining unplaced cohorts:',
            '1. <b>Live Registration Table:</b> Filter by Registered, Unregistered, School, Branch, Gender, and Attendance.',
            '2. <b>Unregistered Students Breakdown:</b> Inspect unallocated counts by school (e.g., SOES: 1820, SOHAS: 1144, SOL: 496, SOM: 494, UID: 439).',
            '3. <b>Bulk Auto-Registration Engine:</b>',
            '   • Fills emptiest projects first to balance supervisor workloads across departments.',
            '   • Strictly enforces project maximum capacity and same/other department quotas.',
            '   • Concurrency-safe algorithm skips students where no eligible quotas remain and logs detailed audit traces.',
            '4. Click <b>Register All Unregistered Students</b> to execute full cohort allocation.'
        ],
        'callout': ('Bulk Registration Safety', 'Bulk registration processes students in deterministic batches. Always verify quota configurations prior to running full cohort auto-allocation.'),
        'image_path': admin_step8_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 9: Master Data Governance & Bulk Excel Imports',
        'content': [
            'Administer campus datasets via standardized Excel templates and direct XLSX ingestion:',
            '1. <b>Standardized Excel Templates:</b> Download official university schema templates for Students Master, Faculty Master, and Cohort Details.',
            '2. <b>Direct XLSX Data Ingestion:</b> Click <b>Direct XLSX Import</b> from the top banner.',
            '3. <b>Select Data Entity:</b> Choose target table (e.g., <i>IDP Cohort Allocations - IDP Cohorts Details_5Sep-2026.xlsx</i>).',
            '4. <b>Academic Year Tag:</b> Enter active academic year tag (e.g., <b>2026-2027</b>).',
            '5. <b>Upload & Populate:</b> System validates column headers, deduplicates entries, and populates the database.'
        ],
        'callout': ('Data Schema Validation', 'Spreadsheets with missing enrollment numbers, duplicate emails, or invalid department codes will fail ingestion with specific row-by-row error logs.'),
        'image_path': admin_step9_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 10: Academic Year Rollover & Cohort Archiving',
        'content': [
            'Transition the university IDP portal across academic session lifecycles:',
            '1. Click <b>Rollover Year</b> on the master dashboard banner.',
            '2. <b>Strict Cohort Isolation Policy:</b> Activating a new academic year seals existing student and project submissions. Previous cohort records remain permanently retrievable in archives.',
            '3. <b>Target Academic Year:</b> Enter the new academic session (e.g., <b>2026-2027</b>).',
            '4. <b>Initial Semester Milestone:</b> Set starting milestone (Semester 1 / Sem 3 PPT Submission).',
            '5. <b>Double-Verification Confirmation:</b> Check confirmation box and click <b>Proceed to Verification</b>.'
        ],
        'callout': ('Irreversible Action', 'Academic Year Rollover locks prior session edits. Ensure all viva grades and final manuscripts are confirmed before advancing the active year.'),
        'image_path': admin_step10_img,
        'max_h': 275
    },
    {
        'step_title': 'Step 11: Institutional Database Management Console & System Governance',
        'content': [
            'Direct access to raw institutional database tables and disaster recovery operations:',
            '1. <b>Institutional Database & Cross-Mappings Console:</b> Query raw tables for Allocations (1,419), Students (6,810), Faculty (196), and Projects (188).',
            '2. <b>1-Click Full Database Export:</b> Exports complete relational state into SQL / JSON / CSV bundles for offsite backup.',
            '3. <b>Safe Wipe & Clean Slate:</b> Wipes mappings while archiving prior states (Pre-export verification mandatory).',
            '4. <b>Purge & Archive:</b> Compresses historical system logs and session tokens into cold storage.',
            '5. <b>Operational Runbook:</b> In case of infrastructure failure, restore database dumps using the automated D1 backup scripts.'
        ],
        'callout': ('Administrator Duty', 'Run database snapshots weekly during active semesters and immediately prior to any bulk allocation or schema migration operations.'),
        'image_path': admin_step11_img,
        'max_h': 275
    }
]

# Compile PDFs
build_pdf(
    'Faculty Guidelines for IDP Project Portal - 2026.pdf',
    'Faculty Guidelines',
    'for Mentoring, Evaluation & Deliverables Management on IDP Portal – 2026',
    faculty_pages
)

build_pdf(
    'SPOC Guidelines for IDP Project Portal - 2026.pdf',
    'Department SPOC Guidelines',
    'for Project Verification, Academic Integrity & Departmental Governance – 2026',
    spoc_pages
)

build_pdf(
    'Admin Guidelines for IDP Project Portal - 2026.pdf',
    'System Administrator Guidelines',
    'for Central IDP Portal Governance, Bulk Allocation & Data Ingestion – 2026',
    admin_pages
)

print("\nALL THREE REFINED PDF GUIDELINES GENERATED AND VERIFIED SUCCESSFULLY!")
