import less from "less";

const mockLess = `
@rosewater: #f5e0dc;
@blue: #89b4fa;

@accentColor: "blue"; // UserStyle variable returns a string

// BUG: This sets @accent to the string "blue"
// @accent: @accentColor; 

// FIX: This would set @accent to the value of @blue (#89b4fa)
@accent: @@accentColor;

.test {
  color: fade(@accent, 50%);
}
`;

async function test() {
  try {
    await less.render(mockLess);
    console.log("✅ Compilation Successful");
  } catch (e: any) {
    console.error("❌ Compilation Failed:");
    console.error(e.message);
  }
}

test();
