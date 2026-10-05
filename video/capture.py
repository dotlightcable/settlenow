from playwright.sync_api import sync_playwright

BASE = "https://settlenow-dtfrf8g2a-joyce-4f3d.vercel.app"
OUT = "/home/star/settlenow/video"
W, H = 1280, 720

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome",
                          args=["--no-sandbox", "--force-device-scale-factor=1"])
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    # 01 landing
    pg.goto(BASE + "/", wait_until="networkidle")
    pg.wait_for_timeout(1200)
    pg.screenshot(path=f"{OUT}/01-landing.png")
    print("01 ok")
    # 02 upload + quote + accept
    pg.goto(BASE + "/upload", wait_until="networkidle")
    pg.wait_for_timeout(1200)
    try:
        btn = pg.get_by_role("button", name="Accept advance")
        btn.click(timeout=5000)
        pg.wait_for_timeout(1000)
    except Exception as e:
        print("accept click failed:", e)
    pg.screenshot(path=f"{OUT}/02-upload.png")
    print("02 ok")
    # 03 pay-link (fresh context to avoid localStorage repaid state)
    ctx2 = b.new_context(viewport={"width": W, "height": H})
    pg2 = ctx2.new_page()
    pg2.goto(BASE + "/pay/INV-1001", wait_until="networkidle")
    pg2.wait_for_timeout(1200)
    pg2.screenshot(path=f"{OUT}/03-pay.png")
    print("03 ok")
    # 04 dashboard
    pg2.goto(BASE + "/dashboard", wait_until="networkidle")
    pg2.wait_for_timeout(1200)
    pg2.screenshot(path=f"{OUT}/04-dashboard.png")
    print("04 ok")
    b.close()
print("ALL DONE")
