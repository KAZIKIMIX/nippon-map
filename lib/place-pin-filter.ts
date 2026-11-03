import type { FilterSpecification } from "maplibre-gl";

// null means global search; [] means no category is selected.
export function placePinCategories(category:string|null,multiCategories:readonly string[],globalSearch:boolean):string[]|null {
  if(globalSearch)return null;
  return multiCategories.length?[...multiCategories]:category?[category]:[];
}

export function placePinFilter(categories:readonly string[]|null):FilterSpecification {
  if(categories===null)return ["!",["has","point_count"]];
  return ["all",["!",["has","point_count"]],["in",["get","category"],["literal",[...categories]]]];
}
