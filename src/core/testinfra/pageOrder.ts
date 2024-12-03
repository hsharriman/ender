import {
  P1,
  P2,
  trianglePretestProofs,
} from "../../theorems/pretest/pretestDiagrams";
import { T1_S1_C1 } from "../../theorems/testA/stage1/C1";
import { T1_S1_C2 } from "../../theorems/testA/stage1/C2";
import { T1_S1_IN1 } from "../../theorems/testA/stage1/IN1";
import { T1_S1_IN2 } from "../../theorems/testA/stage1/IN2";
import { T1_S1_IN3 } from "../../theorems/testA/stage1/IN3";
import { T1_S2_C2 } from "../../theorems/testA/stage2/C2";
import { T1_S2_IN1 } from "../../theorems/testA/stage2/IN1";
import { T1_S2_IN2 } from "../../theorems/testA/stage2/IN2";
import {
  TutorialProof1,
  TutorialProof2,
} from "../../theorems/tutorial/tutorial1";
import { LayoutProps, ProofMeta } from "../types/types";
import { triangleTextPreQuestions } from "./questions/pretestQuestions";
import { fisherYates } from "./randomize";
import { interactiveLayout, pretestLayout, staticLayout } from "./setupLayout";

export enum PageType {
  IntroSlideTest = "IntroSlideTest",
  Background = "Background",
  Pretest = "Pretest",
  Tutorial = "Tutorial",
  Static = "static",
  Interactive = "interactive",
  SUS = "SUS",
  Save = "Save",
  IntroSlidePhase1 = "IntroSlidePhase1",
  IntroSlidePhase2 = "IntroSlidePhase2",
  ParticipantID = "ParticipantID",
  ThinkAloud = "ThinkAloud",
}

export type TestType = PageType.Interactive | PageType.Static;

export type Page = {
  type: PageType;
  meta?: ProofMeta;
};

export const proofOrder = (
  proofs: LayoutProps[],
  type: TestType,
  shuffleTestQuestions: boolean
) => {
  return fisherYates(proofs).map((proof) => {
    return type === PageType.Interactive
      ? interactiveLayout(proof, shuffleTestQuestions)
      : staticLayout(proof, shuffleTestQuestions);
  });
};

export const pageOrder = (testType: TestType) => {
  let pretest = [pretestLayout(P1), pretestLayout(P2)]; // segment and angle questions
  let tpre = trianglePretestProofs.map((p) => pretestLayout(p));
  // add extra 1-off questions to the first triangle pretest page
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
    testType === PageType.Interactive
      ? interactiveLayout(TutorialProof1, false)
      : staticLayout(TutorialProof1, false),
    testType === PageType.Interactive
      ? interactiveLayout(TutorialProof2, false)
      : staticLayout(TutorialProof2, false),
  ];
  const stage1 = proofOrder(
    [T1_S1_C1, T1_S1_C2, T1_S1_IN1, T1_S1_IN2, T1_S1_IN3],
    testType,
    true
  );
  const stage2 = proofOrder(
    fisherYates([T1_S2_C2, T1_S2_IN1, T1_S2_IN2]),
    testType,
    false
  );

  const pages = participantID()
    .concat(background())
    .concat(pretest)
    .concat(tutorial)
    .concat(instruction1())
    .concat(stage1)
    // .concat(instruction2())
    .concat(stage2)
    .concat(sus());

  return pages;
};

const participantID = (): Page[] => {
  return [{ type: PageType.ParticipantID }];
};
const background = (): Page[] => {
  return [
    { type: PageType.IntroSlideTest },
    { type: PageType.Background },
    { type: PageType.ThinkAloud },
  ];
};
const instruction1 = (): Page[] => {
  return [{ type: PageType.IntroSlidePhase1 }];
};
// const instruction2 = (): Page[] => {
//   return [{ type: PageType.IntroSlidePhase2 }];
// };
const sus = (): Page[] => {
  return [{ type: PageType.SUS }, { type: PageType.Save }];
};
