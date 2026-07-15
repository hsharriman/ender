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

- Average Iterations by Mutation Score:

  | mutation_score | avg_iterations |
  | :------------: | :------------: |
  |      1.00      |      1.00      |
  |      2.00      |      1.10      |
  |      3.00      |      1.06      |
  |      4.00      |      1.11      |
  |      5.00      |      1.00      |
  |      6.00      |      1.11      |
