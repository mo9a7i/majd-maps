"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import {
  type Marker,
  type Shape,
  type Project,
  PROJECT_VERSION,
} from "./types";

// ─── State ───────────────────────────────────────────────────────────────────

interface ProjectState {
  markers: Marker[];
  shapes: Shape[];
}

const initialState: ProjectState = {
  markers: [],
  shapes: [],
};

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD_MARKER"; payload: Omit<Marker, "id"> & { id?: string } }
  | { type: "EDIT_MARKER"; payload: Marker }
  | { type: "DELETE_MARKER"; payload: string }
  | { type: "ADD_SHAPE"; payload: Omit<Shape, "id"> }
  | { type: "DELETE_SHAPE"; payload: string }
  | { type: "IMPORT_PROJECT"; payload: Project };

function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case "ADD_MARKER":
      return {
        ...state,
        markers: [...state.markers, { id: action.payload.id ?? uuidv4(), ...action.payload }],
      };
    case "EDIT_MARKER":
      return {
        ...state,
        markers: state.markers.map((m) =>
          m.id === action.payload.id ? action.payload : m
        ),
      };
    case "DELETE_MARKER":
      return {
        ...state,
        markers: state.markers.filter((m) => m.id !== action.payload),
      };
    case "ADD_SHAPE":
      return {
        ...state,
        shapes: [...state.shapes, { ...action.payload, id: uuidv4() } as Shape],
      };
    case "DELETE_SHAPE":
      return {
        ...state,
        shapes: state.shapes.filter((s) => s.id !== action.payload),
      };
    case "IMPORT_PROJECT":
      return {
        ...state,
        markers: action.payload.markers,
        shapes: action.payload.shapes,
      };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ProjectContextValue {
  state: ProjectState;
  addMarker: (marker: Omit<Marker, "id"> & { id?: string }) => void;
  editMarker: (marker: Marker) => void;
  deleteMarker: (id: string) => void;
  addShape: (shape: Omit<Shape, "id">) => void;
  deleteShape: (id: string) => void;
  importProject: (project: Project) => void;
  exportProject: () => Project;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addMarker = useCallback(
    (marker: Omit<Marker, "id"> & { id?: string }) =>
      dispatch({ type: "ADD_MARKER", payload: marker }),
    []
  );
  const editMarker = useCallback(
    (marker: Marker) => dispatch({ type: "EDIT_MARKER", payload: marker }),
    []
  );
  const deleteMarker = useCallback(
    (id: string) => dispatch({ type: "DELETE_MARKER", payload: id }),
    []
  );
  const addShape = useCallback(
    (shape: Omit<Shape, "id">) => dispatch({ type: "ADD_SHAPE", payload: shape }),
    []
  );
  const deleteShape = useCallback(
    (id: string) => dispatch({ type: "DELETE_SHAPE", payload: id }),
    []
  );
  const importProject = useCallback(
    (project: Project) => dispatch({ type: "IMPORT_PROJECT", payload: project }),
    []
  );
  const exportProject = useCallback(
    (): Project => ({
      version: PROJECT_VERSION,
      markers: state.markers,
      shapes: state.shapes,
    }),
    [state.markers, state.shapes]
  );

  return (
    <ProjectContext.Provider
      value={{
        state,
        addMarker,
        editMarker,
        deleteMarker,
        addShape,
        deleteShape,
        importProject,
        exportProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
