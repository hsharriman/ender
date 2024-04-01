# Ender

## Implemented:

- Labeled points
- Segments
- Triangles
- Parallel Markers
- Equal Length Markers
- Multiple tick marks
- Angle Markers
- Coloring specific segments

## TODO

- [ ] Update page layout
- [ ] Given + Prove rows
- [ ] Add reasons
- [ ] render minis
- [ ] add "relies on"
- [ ] add focus to aspects of diagram
- [ ] highlighting of text when clicking on the diagram
- [ ] clean up the render method for the construction so that it's all react components. everything that _will_ be rendered is added up front and the styling is dynamically toggled by app state instead of copying everything around
- [x] Step-by-step interaction instead of grid
- [x] Dynamically updating the styling of objects based on interaction
- [x] Interaction between text of proof and visualization
- [ ] Render mini-constructions alongside steps (fix SVG scaling to fit)
- [ ] Improve the proof class structure / cleanup

## TODO for future proofs

- Circles
- Labeled segments
- Right angle tick marks
- Separating `<Card />` components from the proof files
