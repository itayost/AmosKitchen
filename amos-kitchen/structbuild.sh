#!/bin/bash

# Food Ordering System - Folder Structure Creator
# Creates folders and placeholder files with path comments

echo "🚀 Creating Food Ordering System folder structure..."

# Function to create a file with path comment
create_file() {
    local filepath=$1
    local extension="${filepath##*.}"
    local comment=""
    
    # Determine comment style based on file extension
    case "$extension" in
        "tsx"|"ts"|"js"|"jsx")
            comment="// $filepath"
            ;;
        "css")
            comment="/* $filepath */"
            ;;
        "json")
            comment="{}"
            ;;
        "md")
            comment="<!-- $filepath -->"
            ;;
        "prisma")
            comment="// $filepath"
            ;;
        *)
            comment="# $filepath"
            ;;
    esac
    
    mkdir -p "$(dirname "$filepath")"
    echo "$comment" > "$filepath"
}

# Create root files
create_file ".env.example"
create_file ".gitignore"
create_file "next.config.js"
create_file "package.json"
create_file "tsconfig.json"
create_file "tailwind.config.ts"
create_file "postcss.config.js"
create_file "README.md"
create_file "middleware.ts"

# Prisma files
create_file "prisma/schema.prisma"

# Public files
mkdir -p "public/images"

# App directory files
create_file "app/layout.tsx"
create_file "app/page.tsx"
create_file "app/globals.css"
create_file "app/loading.tsx"
create_file "app/error.tsx"

# Auth group
create_file "app/(auth)/layout.tsx"
create_file "app/(auth)/login/page.tsx"
create_file "app/(auth)/register/page.tsx"

# Dashboard group
create_file "app/(dashboard)/layout.tsx"
create_file "app/(dashboard)/dashboard/page.tsx"

# Orders
create_file "app/(dashboard)/orders/page.tsx"
create_file "app/(dashboard)/orders/loading.tsx"
create_file "app/(dashboard)/orders/new/page.tsx"
create_file "app/(dashboard)/orders/[id]/page.tsx"
create_file "app/(dashboard)/orders/[id]/edit/page.tsx"

# Customers
create_file "app/(dashboard)/customers/page.tsx"
create_file "app/(dashboard)/customers/loading.tsx"
create_file "app/(dashboard)/customers/new/page.tsx"
create_file "app/(dashboard)/customers/[id]/page.tsx"
create_file "app/(dashboard)/customers/[id]/edit/page.tsx"

# Dishes
create_file "app/(dashboard)/dishes/page.tsx"
create_file "app/(dashboard)/dishes/loading.tsx"
create_file "app/(dashboard)/dishes/new/page.tsx"
create_file "app/(dashboard)/dishes/[id]/page.tsx"
create_file "app/(dashboard)/dishes/[id]/edit/page.tsx"

# Ingredients
create_file "app/(dashboard)/ingredients/page.tsx"
create_file "app/(dashboard)/ingredients/new/page.tsx"
create_file "app/(dashboard)/ingredients/[id]/edit/page.tsx"

# Reports
create_file "app/(dashboard)/reports/page.tsx"
create_file "app/(dashboard)/reports/weekly/page.tsx"
create_file "app/(dashboard)/reports/shopping-list/page.tsx"
create_file "app/(dashboard)/reports/analytics/page.tsx"

# Settings
create_file "app/(dashboard)/settings/page.tsx"
create_file "app/(dashboard)/settings/profile/page.tsx"

# API Routes - Auth
create_file "app/api/auth/login/route.ts"
create_file "app/api/auth/logout/route.ts"
create_file "app/api/auth/register/route.ts"

# API Routes - Orders
create_file "app/api/orders/route.ts"
create_file "app/api/orders/[id]/route.ts"
create_file "app/api/orders/weekly/route.ts"

# API Routes - Customers
create_file "app/api/customers/route.ts"
create_file "app/api/customers/[id]/route.ts"

# API Routes - Dishes
create_file "app/api/dishes/route.ts"
create_file "app/api/dishes/[id]/route.ts"

# API Routes - Ingredients
create_file "app/api/ingredients/route.ts"
create_file "app/api/ingredients/[id]/route.ts"

# API Routes - Reports
create_file "app/api/reports/weekly-summary/route.ts"
create_file "app/api/reports/shopping-list/route.ts"

# Components - UI
create_file "components/ui/button.tsx"
create_file "components/ui/card.tsx"
create_file "components/ui/dialog.tsx"
create_file "components/ui/dropdown-menu.tsx"
create_file "components/ui/form.tsx"
create_file "components/ui/input.tsx"
create_file "components/ui/label.tsx"
create_file "components/ui/select.tsx"
create_file "components/ui/table.tsx"
create_file "components/ui/tabs.tsx"
create_file "components/ui/toast.tsx"
create_file "components/ui/toaster.tsx"
create_file "components/ui/skeleton.tsx"

# Components - Layout
create_file "components/layout/sidebar.tsx"
create_file "components/layout/header.tsx"
create_file "components/layout/footer.tsx"
create_file "components/layout/nav-item.tsx"
create_file "components/layout/mobile-nav.tsx"

# Components - Orders
create_file "components/orders/order-form.tsx"
create_file "components/orders/order-list.tsx"
create_file "components/orders/order-status-badge.tsx"
create_file "components/orders/order-summary.tsx"
create_file "components/orders/order-filters.tsx"

# Components - Customers
create_file "components/customers/customer-form.tsx"
create_file "components/customers/customer-list.tsx"
create_file "components/customers/customer-card.tsx"
create_file "components/customers/customer-select.tsx"

# Components - Dishes
create_file "components/dishes/dish-form.tsx"
create_file "components/dishes/dish-list.tsx"
create_file "components/dishes/dish-card.tsx"
create_file "components/dishes/dish-select.tsx"
create_file "components/dishes/ingredients-selector.tsx"

# Components - Reports
create_file "components/reports/weekly-chart.tsx"
create_file "components/reports/revenue-chart.tsx"
create_file "components/reports/popular-dishes.tsx"
create_file "components/reports/report-export.tsx"

# Components - Shared
create_file "components/shared/loading-spinner.tsx"
create_file "components/shared/error-message.tsx"
create_file "components/shared/confirm-dialog.tsx"
create_file "components/shared/date-picker.tsx"
create_file "components/shared/search-bar.tsx"

# Lib files
create_file "lib/db.ts"
create_file "lib/auth.ts"
create_file "lib/supabase.ts"

# Lib - Utils
create_file "lib/utils/cn.ts"
create_file "lib/utils/format.ts"
create_file "lib/utils/date.ts"
create_file "lib/utils/price.ts"
create_file "lib/utils/validation.ts"

# Lib - Hooks
create_file "lib/hooks/use-auth.ts"
create_file "lib/hooks/use-orders.ts"
create_file "lib/hooks/use-customers.ts"
create_file "lib/hooks/use-dishes.ts"
create_file "lib/hooks/use-toast.ts"

# Lib - Actions
create_file "lib/actions/orders.ts"
create_file "lib/actions/customers.ts"
create_file "lib/actions/dishes.ts"
create_file "lib/actions/reports.ts"

# Lib - Types
create_file "lib/types/database.ts"
create_file "lib/types/api.ts"
create_file "lib/types/enums.ts"

echo "✅ Folder structure created successfully!"
echo ""
echo "📊 Summary:"
echo "- Created $(find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.css" -o -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.prisma" | wc -l) files"
echo "- Created $(find . -type d | wc -l) directories"
echo ""
echo "All files contain their pathname as a comment in the first line."
