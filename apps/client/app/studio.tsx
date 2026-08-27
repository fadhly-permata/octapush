import { StudioScreen } from "../src/screens/StudioScreen";

export default function StudioRoute() {
  // TODO(F2): resolve DalContext from active session/project
  return <StudioScreen ctx={{ objectPrefix: "", envSchema: "data_dev", env: "DEV" }} />;
}
