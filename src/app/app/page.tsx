import { ProjectProvider } from "@/lib/ProjectContext";
import MapView from "@/components/Map/MapView";

export default function AppPage() {
  return (
    <ProjectProvider>
      <MapView />
    </ProjectProvider>
  );
}
