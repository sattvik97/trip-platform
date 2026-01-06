# Homepage Categories Configuration

## Overview

The homepage categories are now managed through a centralized configuration file (`categories.ts`). This makes it easy to add, remove, or modify categories without touching the homepage component.

## Adding a New Category

To add a new category, simply add an entry to the `HOMEPAGE_CATEGORIES` array in `frontend/src/config/categories.ts`:

```typescript
{
  id: "unique-category-id",           // Unique identifier
  title: "Category Display Name",      // Title shown on homepage
  sectionType: "slider" | "grid",     // Layout type
  filter: {
    page: 1,
    limit: 20,
    tags: ["TAG1", "TAG2"],           // Optional: filter by tags
    // Other filters: destination, min_price, max_price, start_date
  },
  displayLimit: 5,                    // Number of trips to show (optional)
  gridColumns: 3,                     // Only for grid type (optional, default: 3)
}
```

## Examples

### Example 1: Adventure Trips (Slider)
```typescript
{
  id: "adventure",
  title: "Adventure Trips",
  sectionType: "slider",
  filter: {
    page: 1,
    limit: 20,
    tags: ["ADVENTURE"],
  },
  displayLimit: 5,
}
```

### Example 2: Budget Trips (Grid)
```typescript
{
  id: "budget",
  title: "Budget-Friendly Trips",
  sectionType: "grid",
  filter: {
    page: 1,
    limit: 20,
    tags: ["BUDGET"],
  },
  displayLimit: 6,
  gridColumns: 4,
}
```

### Example 3: Multiple Tags (OR operation)
```typescript
{
  id: "weekend-adventures",
  title: "Weekend Adventures",
  sectionType: "slider",
  filter: {
    page: 1,
    limit: 20,
    tags: ["WEEKEND", "ADVENTURE"],  // Shows trips with WEEKEND OR ADVENTURE
  },
  displayLimit: 5,
}
```

### Example 4: No Filter (All Trips)
```typescript
{
  id: "featured",
  title: "Featured Trips",
  sectionType: "grid",
  filter: {
    page: 1,
    limit: 20,
    // No tags = all trips
  },
  displayLimit: 6,
}
```

## Category Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier for the category |
| `title` | `string` | ✅ | Display title shown on homepage |
| `sectionType` | `"slider" \| "grid"` | ✅ | Layout type: slider (horizontal scroll) or grid |
| `filter` | `GetTripsParams` | ✅ | Filter configuration for fetching trips |
| `displayLimit` | `number` | ❌ | Number of trips to display (default: 3 for slider, 6 for grid) |
| `gridColumns` | `3 \| 4` | ❌ | Grid columns (only for grid type, default: 3) |

## Filter Options

The `filter` property accepts all options from `GetTripsParams`:

- `page?: number` - Page number (default: 1)
- `limit?: number` - Number of trips to fetch (default: 20)
- `tags?: string[]` - Array of tags for filtering (OR operation)
- `destination?: string` - Filter by destination
- `min_price?: number` - Minimum price filter
- `max_price?: number` - Maximum price filter
- `start_date?: string` - Filter by start date

## How It Works

1. **Configuration**: Categories are defined in `categories.ts`
2. **Fetching**: Homepage fetches trips for all categories in parallel
3. **Rendering**: Each category is rendered using the appropriate section component
4. **View All Links**: Automatically generated based on category filters

## Benefits

✅ **Easy to extend**: Just add to the array  
✅ **Type-safe**: TypeScript ensures correct structure  
✅ **Centralized**: All category config in one place  
✅ **Flexible**: Supports any filter combination  
✅ **Maintainable**: No need to modify homepage component  

## Current Categories

1. **Upcoming Trips** - All trips (slider, 5 items)
2. **Trekking Adventures** - TREK tag (grid, 6 items, 3 columns)
3. **Stargazing & Experiences** - STARGAZING tag (slider, 5 items)
4. **Solo Travel Friendly** - SOLO tag (grid, 6 items, 3 columns)

