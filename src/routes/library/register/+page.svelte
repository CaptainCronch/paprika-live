<script>
    let username
    let password

    let form

    async function handleSubmit() {
        form.style.left = "150em"
        let response = await fetch("/library/api/user", {
			body: JSON.stringify({
				'name': username,
				'password': password,
			}),
			method: "POST",
		})
        if (response.ok) {
			alert("User successfully created!")
            location.href = "/library"
		} else {
            form.style.left = "0em"
			let body = await response.text()
			alert(body)
		}
    }
</script>

<svelte:head>
    <title>Register</title>
    <meta name="description" content="Create new user"/>
</svelte:head>

<div class="form" bind:this={form}>
    <input type="text" name="username" id="username" placeholder="username" bind:value={username}>
    <input type="text" name="password" id="password" placeholder="password" bind:value={password}>
</div>
<button id="register" on:click={handleSubmit}>Register</button>

<style>
    #register {
        position: fixed;
        bottom: 6rem;
        font-size: 2.5em;
        padding: 1rem 2rem;
        font-weight: 500;
        background-color: white;
        border: 5px solid #089c8a;
        border-radius: 20px;
    }

    input[type="text"] {
        position: absolute;
        outline: 5px solid #dcfffb;
        transition: all 0.2s;
    }

    input[type="text"]:focus {
        outline: 5px solid #089c8a;
        border-color: #089c8a;
        border-style: solid;
        border-radius: 5px;
    }

    #username {
        top: 190px;
        left: 30px;
        width: 350px;
    }

    #password {
        top: 190px;
        right: 40px;
    }

    .form {
        position: relative;
        --img-scale: 1;
        --img-width: 1621px;
        --img-height: 508px;
        width: calc(var(--img-width) * var(--img-scale));
        height: calc(var(--img-height) * var(--img-scale));
        background-image: url("$lib/images/140-tax-form-scribbled.png");
        background-size: calc(var(--img-width) * var(--img-scale));
        left: 0px;
        transition: all 1s;
    }
</style>