ROCQFLAGS := -Q Ender Ender
MODULES := Audit PublicParser PresentationParser Syntax Geometry Semantics Checker Parser CompleteChecker CertifiedAPI Tests Extract
VOFILES := $(addprefix Ender/,$(addsuffix .vo,$(MODULES)))

.PHONY: all proofs test extract clean

all: proofs

proofs: $(VOFILES)

test: Ender/Tests.vo

extract: Ender/Extract.vo

Ender/Audit.vo: Ender/Audit.v
	rocq compile $(ROCQFLAGS) $<

Ender/Syntax.vo: Ender/Syntax.v Ender/Audit.vo
	rocq compile $(ROCQFLAGS) $<

Ender/PublicParser.vo: Ender/PublicParser.v Ender/Audit.vo
	rocq compile $(ROCQFLAGS) $<

Ender/PresentationParser.vo: Ender/PresentationParser.v Ender/PublicParser.vo
	rocq compile $(ROCQFLAGS) $<

Ender/Geometry.vo: Ender/Geometry.v
	rocq compile $(ROCQFLAGS) $<

Ender/Semantics.vo: Ender/Semantics.v Ender/Syntax.vo Ender/Geometry.vo
	rocq compile $(ROCQFLAGS) $<

Ender/Checker.vo: Ender/Checker.v Ender/Syntax.vo Ender/Geometry.vo Ender/Semantics.vo
	rocq compile $(ROCQFLAGS) $<

Ender/Parser.vo: Ender/Parser.v Ender/Syntax.vo Ender/Semantics.vo Ender/Checker.vo
	rocq compile $(ROCQFLAGS) $<

Ender/CompleteChecker.vo: Ender/CompleteChecker.v Ender/Parser.vo Ender/PublicParser.vo Ender/PresentationParser.vo
	rocq compile $(ROCQFLAGS) $<

Ender/CertifiedAPI.vo: Ender/CertifiedAPI.v Ender/CompleteChecker.vo
	rocq compile $(ROCQFLAGS) $<

Ender/Tests.vo: Ender/Tests.v Ender/CertifiedAPI.vo
	rocq compile $(ROCQFLAGS) $<

Ender/Extract.vo: Ender/Extract.v Ender/CertifiedAPI.vo
	rocq compile $(ROCQFLAGS) $<

clean:
	find Ender -type f \( -name '*.vo' -o -name '*.vos' -o -name '*.vok' -o -name '*.glob' -o -name '*.aux' \) -delete
