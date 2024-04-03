const {describe, it, mock} = require("node:test");
const assert = require("node:assert");
const validator = require("../validate.js");

/**
 * 
 * A simple F to create fake strings for testing
 * 
 * @param {Integer} len Number of times a string will be replicated
 * @param {String} s String to replicate
 * @returns 
 */
function makeString(len, s = "x"){
	return (new Array(len))
		.fill(s)
		.join(" ");
}

// NOTE: I don't document tests since they are already descriptive -- look at the 1st parameter in 'describe' and 'it'

describe("Validator for the user name", ()=>{
	it("should not allow empty inputs", async (t)=>{
		await t.test("including null", ()=>{
			assert.throws(()=>validator.validateAuthorName(null));
		});
		await t.test("including undefined", ()=>{
			assert.throws(()=>validator.validateAuthorName(undefined));
		});
		await t.test("including empty string", ()=>{
			assert.throws(()=>validator.validateAuthorName(""));
		});
		await t.test("including strings with only whitespaces", ()=>{
			assert.throws(()=>validator.validateAuthorName("  		  "));
		});
	});

	it("should not be too long", async (t)=>{
		const MAX_LEN = 128;
		const expectedErr = new Error("Author name is unrealistically long");
		await t.test("testing just over the limit", ()=>{
			assert.throws(()=>validator.validateAuthorName(makeString(MAX_LEN + 1)), expectedErr);
		});

		await t.test("testing over the limit a lot", ()=>{
			assert.throws(()=>validator.validateAuthorName(makeString(MAX_LEN * 10000)), expectedErr);
		});

		await t.test("testing under the limit", ()=>{
			assert.ok(validator.validateAuthorName(makeString(10, "Peter")));
		});
	});

	it("should contain only alphabet characters", async (t)=>{
		await t.test("including punctuation", ()=>{
			assert.throws(()=>validator.validateAuthorName("Paul.Peter"));
		});

		await t.test("including smileys", ()=>{
			assert.throws(()=>validator.validateAuthorName("😊"));
		});
	});

	it("should be a full name", async(t)=>{
		await t.test("with at least name and surname", async (t)=>{
			await t.test("not just a single word", ()=>{
				const err = new Error("Author name needs to be a full name");
				assert.throws(()=>validator.validateAuthorName("Peter"), err);
			});

			await t.test("no abbreviations inside", ()=>{
				assert.throws(()=>validator.validateAuthorName("Peter D. Brown"));
			});

			await t.test("at least two letter words", ()=>{
				assert.throws(()=>validator.validateAuthorName("Peter D"));
			});

			await t.test("realistic name/surname", ()=>{
				assert.ok(validator.validateAuthorName("Peter Brown"));
			});
		});
	});

	it("should trim and capitalize the name", async(t)=>{
		await t.test("trim", ()=>{
			assert.strictEqual(validator.validateAuthorName("  		 Peter Brown 		"), "Peter Brown");
		});

		await t.test("Capitalize 1st letters", ()=>{
			assert.strictEqual(validator.validateAuthorName("peter griffin"), "Peter Griffin");
		});
	});

});

describe("Validator for advertiser links", ()=>{
	it("should fail if it's not http or https", ()=>{
		assert.throws(()=>validator.validateURL("file:///Users/Aleksii/Desktop/tmp1.html"));
	});

	it("should return a URL object for valid links", ()=>{
		const link = "https://developer.mozilla.org/en-US/";
		assert.deepStrictEqual(validator.validateURL(link), (new URL(link)));
	});
});

describe("Checker of links being alive", ()=>{
	const link = "https://developer.mozilla.org/en-US/";
	const fetchF = mock.fn((url) => {
		return {ok: true};
	});
	it("should try to load the link", async ()=>{
		  await assert.strictEqual(fetchF.mock.calls.length, 0);
		  await assert.doesNotReject(validator.checkLinkAlive(link, fetchF));
		  await assert.strictEqual(fetchF.mock.calls.length, 1);
	});

	it("should try to load the right link", ()=>{
		assert.strictEqual(fetchF.mock.calls.length, 1);
		validator.checkLinkAlive(link, fetchF);
		assert.deepStrictEqual(fetchF.mock.calls[0].arguments, [link]);
		assert.strictEqual(fetchF.mock.calls.length, 2);
  	});
});
