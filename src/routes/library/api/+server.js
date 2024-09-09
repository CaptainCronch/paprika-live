import "$lib/library.mjs"
import { error, redirect, json } from '@sveltejs/kit';

export function GET({ params }) {
	let output = {}
	console.log(JSON.stringify(params) + " poop")
	// switch (key) {
	// 	case value:
			
	// 		break;
	
	// 	default:
	// 		break;
	// }

	return new Response(String(output), {
		headers: {
			'Content-Type': 'application/json',
		}
	});
}

export function POST() {

}

export function PUT() {

}

export function DELETE() {
	
}