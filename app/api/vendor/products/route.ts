import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { sendNewCollectionNotification } from "@/src/shared/utils/notificationHelper";
import { getVendorByUser } from "@/src/shared/utils/vendorHelper";
import { createClient } from "@/lib/supabase/server";

// Helper function to get current user for API routes (doesn't redirect)
async function getCurrentUserForApi() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          status: true,
          isActive: true,
        },
      },
    },
  });

  return user;
}

// GET - List all products for vendor
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserForApi();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "VENDOR") {
      console.log("GET /api/vendor/products - User role is not VENDOR:", { userId: user.id, role: user.role });
      return NextResponse.json(
        { success: false, error: "Vendor access required", message: `Your account role is '${user.role}', but vendor access is required.` },
        { status: 403 }
      );
    }

    // Get vendor profile using helper
    const vendor = await getVendorByUser(user);

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor profile not found. Please complete vendor onboarding first." },
        { status: 404 }
      );
    }

    // Get products
    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  console.log("=== BACKEND: POST /api/vendor/products ===");
  console.log("Backend Step 1: Request received");
  
  try {
    console.log("Backend Step 2: Checking user authentication...");
    const user = await getCurrentUserForApi();
    
    if (!user) {
      console.log("Backend Step 2a: FAILED - No authenticated user");
      return NextResponse.json(
        { success: false, error: "Authentication required", message: "Please sign in to continue." },
        { status: 401 }
      );
    }
    
    console.log("Backend Step 3: User authenticated", { userId: user.id, email: user.email, role: user.role });

    if (user.role !== "VENDOR") {
      console.log("Backend Step 3a: FAILED - User role is not VENDOR", { role: user.role });
      return NextResponse.json(
        { success: false, error: "Vendor access required", message: `Your account role is '${user.role}', but vendor access is required. Please contact support if you believe this is an error.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("Backend Step 4: Request body parsed", JSON.stringify(body, null, 2));
    
    const {
      vendorId,
      name,
      description,
      categoryId,
      categoryName, // New: accept category name for auto-creation
      images,
      price,
      compareAtPrice,
      sku,
      stockQuantity,
      lowStockThreshold,
      weight,
      isActive,
    } = body;

    console.log("Backend Step 5: VendorId from request:", vendorId);
    console.log("Backend Step 5a: CategoryId:", categoryId, "CategoryName:", categoryName);

    // Validate required fields - need either categoryId OR categoryName
    if (
      !name ||
      !description ||
      (!categoryId && !categoryName) ||
      !images ||
      images.length === 0 ||
      !price
    ) {
      console.log("Backend Step 6: FAILED - Missing required fields", {
        name: !!name,
        description: !!description,
        categoryId: !!categoryId,
        categoryName: !!categoryName,
        images: images?.length || 0,
        price: !!price,
      });
      return NextResponse.json(
        { success: false, error: "Missing required fields", message: "Category name is required when creating a new category" },
        { status: 400 }
      );
    }
    console.log("Backend Step 6: Required fields validated");

    // Get vendor profile using helper
    console.log("Backend Step 7: Looking up vendor profile for user:", user.id);
    const vendor = await getVendorByUser(user);
    console.log("Backend Step 8: Vendor lookup result:", vendor ? { id: vendor.id, businessName: vendor.businessName } : "NOT FOUND");

    if (!vendor) {
      console.log("Backend Step 9: FAILED - Vendor profile not found for user:", user.id);
      return NextResponse.json(
        { success: false, error: "Vendor profile not found. Please complete vendor onboarding first." },
        { status: 404 }
      );
    }

    // Use the found vendor's ID if vendorId wasn't provided or doesn't match
    const actualVendorId = vendorId || vendor.id;
    console.log("Backend Step 9: Using vendorId:", actualVendorId, "(from request:", vendorId, ", from lookup:", vendor.id, ")");
    
    // Verify vendor ownership
    if (vendor.id !== actualVendorId) {
      console.log("Backend Step 10: FAILED - Vendor ID mismatch", { 
        vendorIdFromLookup: vendor.id, 
        vendorIdFromRequest: actualVendorId,
        vendorIdProvided: vendorId,
        userId: user.id 
      });
      return NextResponse.json(
        { success: false, error: "Vendor ID mismatch", message: "The vendor ID provided does not match your account. Please refresh and try again." },
        { status: 403 }
      );
    }
    console.log("Backend Step 10: Vendor ownership verified");

    // Resolve category - either use provided categoryId or find/create by categoryName
    let resolvedCategoryId = categoryId;
    
    if (!resolvedCategoryId && categoryName) {
      console.log("Backend Step 10a: Resolving category by name:", categoryName);
      
      // Generate slug from category name
      const categorySlug = categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      // Try to find existing category by name or slug
      let category = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: categoryName, mode: 'insensitive' } },
            { slug: categorySlug }
          ]
        }
      });
      
      if (category) {
        console.log("Backend Step 10b: Found existing category:", { id: category.id, name: category.name });
        resolvedCategoryId = category.id;
        
        // If the category exists but doesn't have the vendor's store theme, add it
        const vendorTheme = (vendor as any).storeTheme || "DEFAULT";
        if (category.storeThemes && !category.storeThemes.includes(vendorTheme)) {
          await prisma.category.update({
            where: { id: category.id },
            data: {
              storeThemes: {
                push: vendorTheme
              }
            }
          });
          console.log("Backend Step 10b2: Added store theme to category:", vendorTheme);
        }
      } else {
        // Create new category with vendor's store theme
        const vendorTheme = (vendor as any).storeTheme || "DEFAULT";
        console.log("Backend Step 10b: Creating new category:", categoryName, "with theme:", vendorTheme);
        category = await prisma.category.create({
          data: {
            name: categoryName,
            slug: categorySlug + "-" + Date.now(), // Ensure unique slug
            isActive: true,
            storeThemes: [vendorTheme, "DEFAULT"], // Include both vendor's theme and DEFAULT
          }
        });
        console.log("Backend Step 10c: Created new category:", { id: category.id, name: category.name });
        resolvedCategoryId = category.id;
      }
    }

    if (!resolvedCategoryId) {
      console.log("Backend Step 10d: FAILED - No valid category");
      return NextResponse.json(
        { success: false, error: "Category is required", message: "Please select or enter a category name." },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

    const productData = {
        vendorId: actualVendorId,
        categoryId: resolvedCategoryId,
        name,
        slug,
        description,
        images,
        price,
        compareAtPrice: compareAtPrice || null,
        sku: sku ? sku : null, // Explicitly handle empty string
        stockQuantity: stockQuantity || 0,
        lowStockThreshold: lowStockThreshold || 10,
        weight: weight || null,
        isActive: isActive !== undefined ? isActive : true,
    };

    console.log("Backend Step 11: Creating product with data:", JSON.stringify(productData, null, 2));

    // Create product
    const product = await prisma.product.create({
      data: productData,
      include: {
        category: true,
      },
    });
    console.log("Backend Step 12: Product created successfully", { productId: product.id });

    // Send new collection notification to subscribers (async, don't await)
    // Only send if product is active and has stock
    if (product.isActive && product.stockQuantity > 0) {
      const firstImage = Array.isArray(images) && images.length > 0 ? images[0] : null;
      sendNewCollectionNotification(
        vendor.id,
        product.id,
        product.name,
        firstImage,
        vendor.businessName
      ).catch((error) => {
        console.error("Failed to send new collection notification:", error);
      });
    }

    console.log("Backend Step 13: SUCCESS - Returning response");
    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error: any) {
    console.error("=== BACKEND ERROR ===");
    console.error("Product creation error:", error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error stack:", error?.stack);

    // Handle unique constraint violation (SKU)
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "SKU already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
