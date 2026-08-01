COQFLAGS := -Q Ender Ender
MODULES := Audit PublicParser Syntax Geometry Semantics Checker Parser Tests Extract
VOFILES := $(addprefix Ender/,$(addsuffix .vo,$(MODULES)))

.PHONY: all proofs test extract clean

all: proofs

proofs: $(VOFILES)

test: Ender/Tests.vo

extract: Ender/Extract.vo

Ender/Audit.vo: Ender/Audit.v
	coqc $(COQFLAGS) $<

Ender/Syntax.vo: Ender/Syntax.v Ender/Audit.vo
	coqc $(COQFLAGS) $<

Ender/PublicParser.vo: Ender/PublicParser.v Ender/Audit.vo
	coqc $(COQFLAGS) $<

Ender/Geometry.vo: Ender/Geometry.v
	coqc $(COQFLAGS) $<

Ender/Semantics.vo: Ender/Semantics.v Ender/Syntax.vo Ender/Geometry.vo
	coqc $(COQFLAGS) $<

Ender/Checker.vo: Ender/Checker.v Ender/Syntax.vo Ender/Geometry.vo Ender/Semantics.vo
	coqc $(COQFLAGS) $<

Ender/Parser.vo: Ender/Parser.v Ender/Syntax.vo Ender/Semantics.vo Ender/Checker.vo
	coqc $(COQFLAGS) $<

Ender/Tests.vo: Ender/Tests.v Ender/Parser.vo Ender/PublicParser.vo
	coqc $(COQFLAGS) $<

Ender/Extract.vo: Ender/Extract.v Ender/Parser.vo
	coqc $(COQFLAGS) $<

clean:
	find Ender -type f \( -name '*.vo' -o -name '*.vos' -o -name '*.vok' -o -name '*.glob' -o -name '*.aux' \) -delete
