# Room Interaction System

The autonomous AI remains the only gameplay actor. The browser provides presentation inspection only.

Visible interaction affordances:
- click a projected physical prop to inspect;
- `I` inspects the current authoritative focus object;
- `Escape` returns to the room overview;
- solved/carried/inspected state comes only from the server snapshot.

Inspection changes camera position and emphasis but does not call rules, submit codes, pick up items or mutate inventory. This preserves replay truth and viewer fairness. Carried objects leave the room render and remain represented compactly in inventory. Focus, inspected and solved states use material/emissive/micro-animation differences instead of modal text.
