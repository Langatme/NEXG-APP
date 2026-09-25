/**
 * Present travel and tour offerings under the customer-facing Experiences group.
 * The catalogue keeps the original category IDs for existing merchant records,
 * booking fields, and links; this only changes how categories are browsed.
 */
export function mergeTravelToursIntoExperiences<
  TSubcategory,
  TCategory extends { id: string; slug: string; name: string; description?: string; subcategories: TSubcategory[] },
>(categories: TCategory[]): TCategory[] {
  const experiences = categories.find((category) => category.slug === 'experiences');
  const travelTours = categories.find((category) => category.slug === 'travel-tours');

  if (!experiences || !travelTours) return categories;

  const keyFor = (subcategory: TSubcategory): string => {
    if (typeof subcategory === 'object' && subcategory !== null) {
      const value = subcategory as unknown as Record<string, unknown>;
      const key = value.id ?? value.slug ?? value.name;
      if (key !== undefined) return String(key);
    }
    return String(subcategory);
  };

  const existingKeys = new Set(experiences.subcategories.map(keyFor));
  const mergedSubcategories = [
    ...experiences.subcategories,
    ...travelTours.subcategories.filter((subcategory) => {
      const key = keyFor(subcategory);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    }),
  ];

  const mergedExperiences = {
    ...experiences,
    description: 'Events, classes, safaris, guided tours and travel packages.',
    subcategories: mergedSubcategories,
  } as TCategory;

  return categories.flatMap((category) => {
    if (category.slug === 'travel-tours') return [];
    return category.slug === 'experiences' ? [mergedExperiences] : [category];
  });
}
