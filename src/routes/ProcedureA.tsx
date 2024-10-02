import { Procedure } from "../components/procedure/Procedure";
import { PageType } from "../core/testinfra/pageOrder";

export const ProcedureA = () => {
  return <Procedure type={PageType.Interactive} />;
};
