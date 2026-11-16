# 🎯 FINAL SETUP - Simple Steps

## ✅ Current Status:
- Backend LIVE: https://school-of-discipleship-backend.onrender.com
- Frontend LIVE: https://school-of-discipleship-frontend.onrender.com
- Both need configuration to talk to each other

---

## 📝 STEP-BY-STEP GUIDE

### **STEP 1: Update Backend Environment Variable**

1. Go to https://dashboard.render.com/
2. Click on **"school-of-discipleship-backend"**
3. Click **"Environment"** (left sidebar)
4. Find **"BACKEND_CORS_ORIGINS"**
5. Click the **Edit** button (pencil icon)
6. Change the value to:
   ```
   ["https://school-of-discipleship-frontend.onrender.com"]
   ```
7. Click **"Save Changes"**
8. Render will **automatically redeploy** - wait ~2 minutes

---

### **STEP 2: Update Frontend Environment Variable**

1. Still in Render dashboard, go back
2. Click on **"school-of-discipleship-frontend"**
3. Click **"Environment"** (left sidebar)
4. Find **"NEXT_PUBLIC_API_URL"**
5. Click the **Edit** button (pencil icon)
6. Change the value to:
   ```
   https://school-of-discipleship-backend.onrender.com
   ```
7. Click **"Save Changes"**
8. Render will **automatically redeploy** - wait ~3 minutes

---

### **STEP 3: Configure Supabase Authentication**

1. Go to: https://supabase.com/dashboard/project/zlsijkmythaxtqrjocza/auth/url-configuration
2. Look for **"Redirect URLs"** section
3. Click **"Add URL"** button
4. Paste this URL:
   ```
   https://school-of-discipleship-frontend.onrender.com/auth/callback
   ```
5. Click **"Save"** or **"Add"**

---

### **STEP 4: Wait for Redeployments (Important!)**

- Backend redeploy: ~2 minutes
- Frontend redeploy: ~3 minutes
- **Total wait: ~5 minutes**

You can watch the "Events" tab in each service to see progress.

---

### **STEP 5: Test Your Application! 🎉**

Once both services show "Live" status:

1. **Open frontend**: https://school-of-discipleship-frontend.onrender.com
2. Try to **register** a new student account
3. Try to **login**
4. Check if pages load

---

## 🚨 If Something Doesn't Work:

**Tell me:**
1. Which step you're on
2. What error you see
3. Screenshot if possible

---

## 📌 What Happens After This:

Once testing works:
- ✅ Students can register and login
- ✅ Admin can manage applications  
- ✅ All features will work
- 🌐 We can then connect your custom domain: **interprayerleague.com**

---

## ⏱️ TIMELINE:

- **Step 1-2:** 5 minutes (updating variables)
- **Step 3:** 2 minutes (Supabase config)
- **Step 4:** 5 minutes (waiting for redeploys)
- **Step 5:** 2 minutes (testing)

**Total: ~15 minutes** ⏰

---

## 💡 REMEMBER:

- Both services are ALREADY LIVE
- We're just connecting them together
- After this, everything will work!

---

**START WITH STEP 1 NOW! 🚀**
