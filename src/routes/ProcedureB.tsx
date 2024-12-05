import { Procedure } from "../components/procedure/Procedure";
import { PageType } from "../core/testinfra/pageOrder";

export const ProcedureB = () => {
  return <Procedure type={PageType.Static} />;
};
