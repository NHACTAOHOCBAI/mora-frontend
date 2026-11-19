import type { SpaceResponse } from "../types";

export type SpaceSort = "newest" | "name";
export function filterAndSortSpaces(
  spaces: SpaceResponse[],
  search: string,
  sort: SpaceSort,
) {
  const query = search.trim().toLocaleLowerCase("vi");
  return spaces
    .filter((space) => space.name.toLocaleLowerCase("vi").includes(query))
    .sort((a, b) => {
      if (sort === "name")
        return a.name.localeCompare(b.name, "vi") || a.id - b.id;
      return (
        (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) ||
        b.id - a.id
      );
    });
}
export function canDeleteSpace(space: SpaceResponse, userRole?: string) {
  return space.currentUserRole === "OWNER" || userRole === "ROLE_ADMIN";
}

export function paginateSpaces(
  spaces: SpaceResponse[],
  page: number,
  pageSize: number,
) {
  return spaces.slice((page - 1) * pageSize, page * pageSize);
}
