/**
 * Generic Store Factory
 *
 * Creates Zustand stores with common CRUD patterns for local-first data management.
 * Reduces code duplication across groups, students, sessions, and progress stores.
 *
 * Usage:
 * ```typescript
 * const useGroupsStore = createEntityStore<LocalGroup, Group, GroupInsert>({
 *   table: db.groups,
 *   mapToApi: mapLocalToGroup,
 *   validateInsert: validateGroup,
 * });
 * ```
 */

import { create } from 'zustand';
import type { Table } from 'dexie';

/**
 * Base state interface for entity stores
 */
export interface EntityState<TApi> {
  items: TApi[];
  selectedItem: TApi | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Base actions interface for entity stores
 */
export interface EntityActions<TApi, TInsert, TUpdate> {
  fetchAll: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: TInsert) => Promise<TApi | null>;
  update: (id: string, data: TUpdate) => Promise<void>;
  delete: (id: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Combined store type
 */
export type EntityStore<TApi, TInsert, TUpdate> = EntityState<TApi> &
  EntityActions<TApi, TInsert, TUpdate>;

/**
 * Configuration for creating an entity store
 */
export interface EntityStoreConfig<TLocal, TApi, TInsert, TUpdate> {
  /** Dexie table for this entity */
  table: Table<TLocal, number>;
  /** Function to map local entity to API entity */
  mapToApi: (local: TLocal) => TApi;
  /** Function to map API insert to local insert */
  mapInsertToLocal: (insert: TInsert) => Omit<TLocal, 'id' | 'created_at' | 'updated_at'>;
  /** Function to map API update to local update */
  mapUpdateToLocal: (update: TUpdate) => Partial<TLocal>;
  /** Validation function for inserts (returns { isValid, errors }) */
  validateInsert?: (data: TInsert) => { isValid: boolean; errors: string[] };
  /** Function to extract numeric ID from string ID */
  parseId: (id: string) => number | null;
  /** Entity name for error messages */
  entityName: string;
}

/**
 * Creates a generic entity store with common CRUD operations
 *
 * This factory reduces boilerplate by providing:
 * - Standard state shape (items, selectedItem, isLoading, error)
 * - Common actions (fetchAll, fetchById, create, update, delete)
 * - Consistent error handling
 * - Loading state management
 *
 * @param config - Store configuration
 * @returns Zustand store hook
 */
export function createEntityStore<
  TLocal extends { id?: number },
  TApi extends { id: string },
  TInsert,
  TUpdate = Partial<TInsert>
>(config: EntityStoreConfig<TLocal, TApi, TInsert, TUpdate>) {
  const {
    table,
    mapToApi,
    mapInsertToLocal,
    mapUpdateToLocal,
    validateInsert,
    parseId,
    entityName,
  } = config;

  return create<EntityStore<TApi, TInsert, TUpdate>>((set) => ({
    items: [],
    selectedItem: null,
    isLoading: false,
    error: null,

    fetchAll: async () => {
      set({ isLoading: true, error: null });
      try {
        const localItems = await table.toArray();
        const items = localItems.map(mapToApi);
        set({ items, isLoading: false });
      } catch (err) {
        set({
          error: `Failed to fetch ${entityName}s: ${(err as Error).message}`,
          isLoading: false,
          items: [],
        });
      }
    },

    fetchById: async (id: string) => {
      set({ isLoading: true, error: null, selectedItem: null });
      try {
        const numericId = parseId(id);
        if (numericId === null) {
          throw new Error(`Invalid ${entityName} ID`);
        }

        const item = await table.get(numericId);
        if (!item) {
          throw new Error(`${entityName} not found`);
        }

        set({ selectedItem: mapToApi(item), isLoading: false });
      } catch (err) {
        set({
          error: (err as Error).message,
          isLoading: false,
          selectedItem: null,
        });
      }
    },

    create: async (data: TInsert) => {
      set({ isLoading: true, error: null });

      // Validate if validator provided
      if (validateInsert) {
        const validation = validateInsert(data);
        if (!validation.isValid) {
          set({ error: validation.errors.join(', '), isLoading: false });
          return null;
        }
      }

      try {
        const localData = {
          ...mapInsertToLocal(data),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as TLocal;

        const newId = await table.add(localData);
        const created = await table.get(newId);

        if (!created) {
          throw new Error(`Failed to create ${entityName}`);
        }

        const apiEntity = mapToApi(created);

        set((state) => ({
          items: [...state.items, apiEntity],
          isLoading: false,
        }));

        return apiEntity;
      } catch (err) {
        set({ error: (err as Error).message, isLoading: false });
        return null;
      }
    },

    update: async (id: string, data: TUpdate) => {
      set({ isLoading: true, error: null });

      try {
        const numericId = parseId(id);
        if (numericId === null) {
          throw new Error(`Invalid ${entityName} ID`);
        }

        const localUpdate = {
          ...mapUpdateToLocal(data),
          updated_at: new Date().toISOString(),
        };

        // Dexie's update method expects UpdateSpec which is assignable from object literals
        await table.update(numericId, localUpdate as Parameters<typeof table.update>[1]);

        const updated = await table.get(numericId);
        if (!updated) {
          throw new Error(`${entityName} not found after update`);
        }

        const apiEntity = mapToApi(updated);

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? apiEntity : item
          ),
          selectedItem:
            state.selectedItem?.id === id ? apiEntity : state.selectedItem,
          isLoading: false,
        }));
      } catch (err) {
        set({ error: (err as Error).message, isLoading: false });
      }
    },

    delete: async (id: string) => {
      set({ isLoading: true, error: null });

      try {
        const numericId = parseId(id);
        if (numericId === null) {
          throw new Error(`Invalid ${entityName} ID`);
        }

        await table.delete(numericId);

        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          selectedItem:
            state.selectedItem?.id === id ? null : state.selectedItem,
          isLoading: false,
        }));
      } catch (err) {
        set({ error: (err as Error).message, isLoading: false });
      }
    },

    clearError: () => {
      set({ error: null });
    },
  }));
}

/**
 * Creates a store with additional filtering capabilities
 */
export interface FilterableEntityState<TApi, TFilter> extends EntityState<TApi> {
  filter: TFilter;
}

export interface FilterableEntityActions<TApi, TInsert, TUpdate, TFilter>
  extends EntityActions<TApi, TInsert, TUpdate> {
  setFilter: (filter: Partial<TFilter>) => void;
}

export type FilterableEntityStore<TApi, TInsert, TUpdate, TFilter> =
  FilterableEntityState<TApi, TFilter> &
  FilterableEntityActions<TApi, TInsert, TUpdate, TFilter>;
