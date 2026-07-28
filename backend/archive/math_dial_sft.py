from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "eth-nlped/MathDial-SFT-Qwen2.5-1.5B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# The model was trained with conversations that include:
# The System prompt with the student's name (in this example "Mariana"), A math word problem with the correct solution and the student's incorrect solution.
# Then the Tutor (assistant) asks the student (user) to explain their solution
# Followed by the student's explanation
# The conversation can be extended by adding another tutor response and the student's next message.
# For more conversations, check out the MathDial dataset, linked above
with open("backend/prompt/system_prompt_1.txt", "r") as f:
    prompt = f.read()
with open("src/checker/proofs/s2inc1.txt", "r") as f:
    student = f.read()
messages = [
    {
        "content": prompt,
        "role": "system",
    },
    {
        "content": student,
        "role": "user",
    },
]
# apply chat template
chat_text = tokenizer.apply_chat_template(
    messages, tokenize=False, add_generation_prompt=True
)
inputs = tokenizer(chat_text, return_tensors="pt").to(model.device)
outputs = model.generate(**inputs, max_new_tokens=512)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
# Example output: excellent start. lets work from the top. if we know she has 12 spoons left, and already used 3. how many did she start with?
