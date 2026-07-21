# Feedback agent

## Run feedback agent

There should be a directory named the same as the name of the wrong proof to run
the feedback agent.

```
python backend/feedback_agent.py path-to-wrong-proof-directory
```

## Solver agent

status

```
"correct" | "fixed" | "unfixable" | "unparsable"
```

### Solver agent evaluation result

- Total Average Iterations:1.06
- Total Cost: $7.5615
- Total failed: 7/120
- Corrected total failed(in 3iter): 1/120

- Average Iterations by Mutation Score:

  | mutation_score | avg_iterations |
  | :------------: | :------------: |
  |      1.00      |      1.00      |
  |      2.00      |      1.10      |
  |      3.00      |      1.06      |
  |      4.00      |      1.11      |
  |      5.00      |      1.00      |
  |      6.00      |      1.11      |

- **why?**
  - checker making error for
    - holt_s6-2_theorem6-2-1_p1_c1.txt (2) -> fixed checker
    - holt_s6-2_theorem6-2-1_p2_c1.txt (2) -> fixed checker
  - parsing failed --> will be fixed if step numbers are reordered in wrong
    proof generation step
    - holt_s4-4_ex4_2corrs_inc4 (also the generated altint doesn't have all
      param and angles are noted as EGF instead of a_EGF) -> fixed prompt
    - holt_s4-5_ex3_2corrs_inc10

  - holt_s4-6_exer11_3corrs_inc1
    - missing step 3
    - but the corrections are correct for all 3 mutated steps
    - --> solved in 1 trial when ran again.
