import { StudioScreen } from "../src/screens/StudioScreen";
import { useLocalSearchParams } from "expo-router";

export default function StudioRoute() {
  // TODO(F2): resolve DalContext from active session/project
  return <StudioScreen ctx={{ objectPrefix: "", envSchema: "data_dev", env: "DEV" }} />;
}
