.PHONY: setup dev hooks check
setup:
	npm run setup
dev:
	npm run dev:all
hooks:
	npm run hooks
check:
	npm run check:setup
	npm run check
