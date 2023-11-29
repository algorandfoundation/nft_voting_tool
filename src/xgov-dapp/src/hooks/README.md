# Reusable Hooks (@algorandfoundaiton/xgov-hooks)

In the future we can move these to a separate package for public use. Regardless of state management toolchains, we
should always export a single easy to use `hook` for consuming in the UI.

# Reasoning:

Splitting the core business logic into `hooks` allows us to easily test the logic and UI in isolation. It also creates less complexity
at the point of implementation. The consumer only needs to know what `props` to pass to the hook and what `props` to expect in return and
not the specific implementation details.
