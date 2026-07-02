import json
import difflib
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text


def generate_diff_text(old_str, new_str):
    """Generates a color-coded Rich Text object showing line-by-line changes."""
    old_lines = old_str.splitlines()
    new_lines = new_str.splitlines()

    diff = difflib.ndiff(old_lines, new_lines)
    rich_text = Text()

    for line in diff:
        if line.startswith("+ "):
            rich_text.append(line[2:] + "\n", style="bold green")
        elif line.startswith("- "):
            rich_text.append(line[2:] + "\n", style="bold red")
        elif line.startswith("  "):
            rich_text.append(line[2:] + "\n", style="dim white")

    return rich_text


def visualize_changes(solver_metadata):
    data = json.loads(solver_metadata)
    console = Console()
    previous_solution = data["iterations"][-2]["solution"]
    current = current_solution = data["iterations"][-1]
    current_solution = current["solution"]
    if data["total_iterations"] == "0":
        console.print("\n[bold yellow]Student's proof[/bold yellow] " + "─" * 40)
    else:
        console.print(
            f"\n[bold yellow]🔄 Iteration {data['total_iterations']}[/bold yellow] "
            + "─" * 40
        )

    # Check for duplication
    if current_solution == previous_solution:
        console.print(
            "[bold blink red]⚠️ WARNING: Code is a 100% identical copy of the previous step! The LLM is looping.[/bold blink red]"
        )

    table = Table(show_header=True, expand=True)
    table.add_column("Code Mutations (Diff vs Previous Step)", ratio=6)
    table.add_column("Checker Error Feedback", ratio=4)

    #  Code column
    code_display = generate_diff_text(previous_solution, current_solution)

    table.add_row(
        code_display,
        Panel(current["checker_output"].strip(), border_style="red"),
    )

    console.print(table)
