const chai = require("chai");

describe("a pointless test suite -- replace with something meaningful", ()=>{
	it("should say hi", ()=>{
		const msg = "hi";
		chai.expect(msg).to.equal("hi");
	});
	// failing test
	it("should say hi again", ()=>{
		// const msg = "bye";
		const msg = "hi";
		chai.expect(msg).to.equal("hi");
	});
});