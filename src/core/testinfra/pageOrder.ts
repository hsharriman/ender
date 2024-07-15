import { triangleTextPreQuestions } from "../../questions/pretestQuestions";
import {
  tutorial1Steps,
  tutorial3Steps,
} from "../../questions/tutorialContent";
import {
  P1,
  P2,
  trianglePretestProofs,
} from "../../theorems/pretest/pretestDiagrams";
import { T1_S1_C1 } from "../../theorems/testA/stage1/C1";
import { T1_S1_C2 } from "../../theorems/testA/stage1/C2";
import { T1_S1_C3 } from "../../theorems/testA/stage1/C3";
import { T1_S1_IN1 } from "../../theorems/testA/stage1/IN1";
import { T1_S1_IN2 } from "../../theorems/testA/stage1/IN2";
import { T1_S1_IN3 } from "../../theorems/testA/stage1/IN3";
import { T1_S2_C1 } from "../../theorems/testA/stage2/C1";
import { T1_S2_C2 } from "../../theorems/testA/stage2/C2";
import { T1_S2_IN1 } from "../../theorems/testA/stage2/IN1";
import { T1_S2_IN2 } from "../../theorems/testA/stage2/IN2";
import {
  TutorialProof1,
  TutorialProof2,
} from "../../theorems/tutorial/tutorial1";
import { ProofMeta } from "../types/types";
import {
  fisherYates,
  interactiveLayout,
  pretestLayout,
  randomizeLayout,
} from "./setupLayout";

export enum PageType {
  Background = "Background",
  Pretest = "Pretest",
  Tutorial = "Tutorial",
  Static = "static",
  Interactive = "interactive",
  StaticSUS = "StaticSUS",
  IntSUS = "IntSUS",
  Save = "Save",
  IntroSlidePhase1 = "IntroSlidePhase1",
  IntroSlidePhase2 = "IntroSlidePhase2",
}

export type Page = {
  type: PageType;
  meta?: ProofMeta;
};

export const pageOrder = () => {
  let pretest = [pretestLayout(P1), pretestLayout(P2)]; // segment and angle questions
  let tpre = trianglePretestProofs.map((p) => pretestLayout(p));
  if (tpre[0].meta) {
    tpre[0].meta = {
      ...tpre[0].meta,
      props: {
        ...tpre[0].meta.props,
        questions: tpre[0].meta.props.questions.concat(
          fisherYates(triangleTextPreQuestions)
        ),
      },
    };
  }

  pretest = pretest.concat(tpre);
  const tutorial = [
    interactiveLayout(TutorialProof1, false, tutorial1Steps),
    interactiveLayout(TutorialProof2, false, tutorial3Steps),
  ];
  const stage1 = randomizeLayout(
    fisherYates([
      T1_S1_C1,
      T1_S1_C2,
      T1_S1_C3,
      T1_S1_IN1,
      T1_S1_IN2,
      T1_S1_IN3,
    ]),
    true
  );
  const stage2 = randomizeLayout(
    fisherYates([T1_S2_C1, T1_S2_C2, T1_S2_IN1, T1_S2_IN2]),
    false
  );
  // const challenge = randomizeLayout(fisherYates([T1_CH1_IN1]), false);
  const challenge: Page[] = [];

  const pages = background()
    .concat(pretest)
    .concat(tutorial)
    .concat(stage1)
    .concat(stage2)
    .concat(challenge)
    .concat(sus());

  return pages;
};

const background = (): Page[] => {
  return [{ type: PageType.Background }];
};
const sus = (): Page[] => {
  return [
    { type: PageType.StaticSUS },
    { type: PageType.IntSUS },
    { type: PageType.Save },
  ];
};
