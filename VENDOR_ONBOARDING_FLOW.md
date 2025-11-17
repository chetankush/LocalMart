# Vendor Onboarding Flow Diagram

## 📊 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEW VENDOR REGISTRATION                      │
│                          /become-vendor                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN APPROVAL PENDING                        │
│                   (Manual review by admin)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 1: BUSINESS INFORMATION                     │
│                  /vendor/onboarding (Step 1/3)                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  • Business Name:  [____________________]                   │ │
│ │  • Business Type:  [Grocery Store ▼]                        │ │
│ │  • Contact Email:  [____________________]                   │ │
│ │  • Contact Phone:  [____________________] (optional)        │ │
│ │                                                              │ │
│ │                    [Continue Button →]                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 2: STORE LOCATION                         │
│                  /vendor/onboarding (Step 2/3)                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  • Street Address: [____________________]                   │ │
│ │  • City:           [________]  State: [________]            │ │
│ │  • PIN Code:       [______]                                 │ │
│ │                                                              │ │
│ │         [← Back]            [Continue Button →]             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 3: DELIVERY SETTINGS                        │
│                  /vendor/onboarding (Step 3/3)                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  • Delivery Radius (km):   [___] (How far you deliver)     │ │
│ │  • Delivery Charge (₹):    [___] (Per order charge)        │ │
│ │  • Min Order Amount (₹):   [___] (Minimum order value)     │ │
│ │                                                              │ │
│ │         [← Back]     [Complete Setup & Add Products →]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              PRODUCT TEMPLATE SELECTION SCREEN                   │
│               /vendor/onboarding/add-products                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⚡ Quick Start: Add Your Products                         │  │
│  │ Save time! Select from our suggestions                    │  │
│  │                                                            │  │
│  │ ✅ 3 products added                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Select Product Category:                                  │  │
│  │  [🛒 Grocery] [👕 Fashion] [💊 Pharmacy] [📱 Electronics] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Search: [Type to search products...🔍]                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Popular Products in Grocery:                              │  │
│  │                                                            │  │
│  │ ┌───────────┐  ┌───────────┐  ┌───────────┐             │  │
│  │ │ Fortune   │  │ Tata Salt │  │ Aashirvaad│             │  │
│  │ │ Sunflower │  │ (1kg)     │  │ Atta (5kg)│             │  │
│  │ │ Oil (1L)  │  │           │  │           │             │  │
│  │ │ Popular   │  │ Popular   │  │ Popular   │             │  │
│  │ │ ₹180      │  │ ₹25       │  │ ₹250      │             │  │
│  │ │[Quick Add]│  │[Quick Add]│  │[Quick Add]│             │  │
│  │ └───────────┘  └───────────┘  └───────────┘             │  │
│  │                                                            │  │
│  │ ┌───────────┐  ┌───────────┐  ┌───────────┐             │  │
│  │ │ Surf Excel│  │ Lux Soap  │  │ Parle-G   │ ✅          │  │
│  │ │ Detergent │  │ (125g)    │  │ Biscuits  │             │  │
│  │ │ (1kg)     │  │           │  │ (200g)    │             │  │
│  │ │ Popular   │  │ Popular   │  │ Popular   │             │  │
│  │ │ ₹120      │  │ ₹35       │  │ ₹20       │             │  │
│  │ │[Quick Add]│  │[Quick Add]│  │  Added    │             │  │
│  │ └───────────┘  └───────────┘  └───────────┘             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Bottom Action Bar (Sticky):                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Great! You've added 3 products                            │  │
│  │                                                            │  │
│  │      [+ Add Custom Product]  [Go to Dashboard →]          │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ (Clicks "Quick Add")
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   QUICK ADD MODAL (POPUP)                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  Quick Add: Fortune Sunflower Oil                           │ │
│ │                                                              │ │
│ │  Your Selling Price (₹) *                                   │ │
│ │  [180____] (suggested: ₹180)                                │ │
│ │                                                              │ │
│ │  Stock Quantity *                                           │ │
│ │  [50_____] (How many items do you have?)                    │ │
│ │                                                              │ │
│ │  💡 You can add images and more details later               │ │
│ │                                                              │ │
│ │         [Cancel]              [Add Product]                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
                   ✅ Product Added Successfully!
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VENDOR DASHBOARD                             │
│                    /vendor/dashboard                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  Welcome back, Sharma General Store! 🎉                     │ │
│ │                                                              │ │
│ │  📦 Products: 3        📊 Orders: 0       ⭐ Rating: N/A    │ │
│ │                                                              │ │
│ │  Quick Actions:                                             │ │
│ │  • [+ Add More Products]                                    │ │
│ │  • [View My Products]                                       │ │
│ │  • [Update Store Settings]                                  │ │
│ │  • [View Orders]                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Decision Points

### At Product Template Screen:
```
              Vendor can choose:
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
  [Quick Add]  [Skip for Now]  [Custom Product]
        │            │            │
        │            │            │
    Add from     Go to        Manual form
    template    dashboard    (full details)
```

## ⏱️ Time Estimates

| Step | Time | Cumulative |
|------|------|------------|
| Step 1: Business Info | 1 min | 1 min |
| Step 2: Location | 1 min | 2 min |
| Step 3: Delivery | 30 sec | 2.5 min |
| Product Selection | 30 sec | 3 min |
| Quick Add (per product) | 15 sec | 3.25 min |
| Add 5 products | 1.25 min | 4.5 min |
| **Total Time** | **~5 min** | **Complete!** |

## 📱 Mobile View Adaptation

```
Mobile Stack Layout:
┌─────────────────┐
│   Progress Bar  │ ← Sticky top
├─────────────────┤
│   Form Content  │
│    (Scrolls)    │
│                 │
│                 │
│                 │
├─────────────────┤
│ [Action Button] │ ← Sticky bottom
└─────────────────┘
```

## 🔄 Alternative Paths

### Vendor wants to skip products:
```
Product Template Screen → "Skip for Now" → Dashboard
                          (with prompt to add later)
```

### Vendor wants full control:
```
Product Template Screen → "+ Add Custom Product" → Full Form
                          (app/vendor/products/new)
```

### Vendor wants to add more products later:
```
Dashboard → "Products" → "+ Add Product" → Choose Template or Custom
```

## 🎨 Visual Design Principles

1. **Progress Visible**: Always show where vendor is in the process
2. **One Thing at a Time**: Each step focuses on one aspect
3. **Smart Defaults**: Pre-fill suggested values
4. **Skip Options**: Allow flexibility without forcing completion
5. **Visual Feedback**: Show success states clearly
6. **Help Text**: Provide guidance at every step

## 🚦 Status Indicators

```
Empty Circle (○)     → Not started
Blue Circle (●)      → Current step
Green Check (✅)     → Completed
```

## 💾 Data Flow

```
Step 1 Form Data → Store in state
                        ↓
Step 2 Form Data → Merge with state
                        ↓
Step 3 Form Data → Merge with state
                        ↓
                API Call: POST /api/vendor/onboarding
                        ↓
              Vendor Profile Created
                        ↓
        Redirect to Product Template Page
                        ↓
              Select Template
                        ↓
         Quick Add with Price & Stock
                        ↓
        API Call: POST /api/vendor/products
                        ↓
              Product Created
                        ↓
            Show Success Message
                        ↓
        Allow adding more or go to Dashboard
```

---

**Note**: This flow is designed for **speed** and **ease of use** while maintaining flexibility for power users who want full control.
