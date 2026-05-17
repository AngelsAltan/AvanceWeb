import { useState } from "react";
import styles from "./Contact.module.css";

const defaultDatos = {
	nombre: "",
	correo: "",
	telefonoExtension: "GT",
	telefono: "",
	mensaje: "",
};

const extensiones = [
	{ id: "GT", label: "Guatemala", dial: "+502" },
	{ id: "AR", label: "Argentina", dial: "+54" },
	{ id: "BZ", label: "Belice", dial: "+501" },
	{ id: "BO", label: "Bolivia", dial: "+591" },
	{ id: "BR", label: "Brasil", dial: "+55" },
	{ id: "CA", label: "Canada", dial: "+1" },
	{ id: "CL", label: "Chile", dial: "+56" },
	{ id: "CO", label: "Colombia", dial: "+57" },
	{ id: "CR", label: "Costa Rica", dial: "+506" },
	{ id: "CU", label: "Cuba", dial: "+53" },
	{ id: "EC", label: "Ecuador", dial: "+593" },
	{ id: "SV", label: "El Salvador", dial: "+503" },
	{ id: "US", label: "Estados Unidos", dial: "+1" },
	{ id: "HN", label: "Honduras", dial: "+504" },
	{ id: "MX", label: "Mexico", dial: "+52" },
	{ id: "NI", label: "Nicaragua", dial: "+505" },
	{ id: "PA", label: "Panama", dial: "+507" },
	{ id: "PY", label: "Paraguay", dial: "+595" },
	{ id: "PE", label: "Peru", dial: "+51" },
	{ id: "DO", label: "Republica Dominicana", dial: "+1" },
	{ id: "UY", label: "Uruguay", dial: "+598" },
	{ id: "VE", label: "Venezuela", dial: "+58" },
];

export default function Contact() {
	const [datos, setDatos] = useState(defaultDatos);
	const [cargando, setCargando] = useState(false);
	const [mostrarModal, setMostrarModal] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (event) => {
		const { name, value } = event.target;
		setDatos((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");

		if (!datos.nombre || !datos.correo || !datos.telefono || !datos.mensaje) {
			setError("Por favor llena los campos obligatorios (*)");
			return;
		}

		const nombreRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
		if (!nombreRegex.test(datos.nombre)) {
			setError("El nombre solo puede contener letras");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(datos.correo)) {
			setError("El correo no tiene un formato valido");
			return;
		}

		const telefonoRegex = /^\d{8}$/;
		if (!telefonoRegex.test(datos.telefono)) {
			setError("El telefono debe contener 8 numeros");
			return;
		}

		setCargando(true);

		try {
			const extensionSeleccionada = extensiones.find(
				(ext) => ext.id === datos.telefonoExtension
			);
			const telefonoConExtension = extensionSeleccionada
				? `${extensionSeleccionada.dial} ${datos.telefono}`
				: datos.telefono;

			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nombre:   datos.nombre,
					correo:   datos.correo,
					telefono: telefonoConExtension,
					mensaje:  datos.mensaje,
				}),
			});

			if (res.ok) {
				setMostrarModal(true);
				setDatos(defaultDatos);
			} else {
				setError("Hubo un problema al enviar el mensaje. Intenta mas tarde.");
			}
		} catch (err) {
			console.error(err);
			setError("Error de conexion. Revisa tu internet.");
		} finally {
			setCargando(false);
		}
	};

	return (
		<section className={styles.contact}>
			<div className={styles.container}>
				<h2 className={styles.title}>Contactanos</h2>
				<p className={styles.lead}>
					Tienes dudas o necesitas una cotizacion a medida? Escribenos.
				</p>
				<div className={styles.card}>
					{error && <div className={styles.alert}>{error}</div>}
					<form onSubmit={handleSubmit} className={styles.form}>
						<div className={styles.field}>
							<label className={styles.label} htmlFor="contacto-nombre">
								Nombre completo: *
							</label>
							<input
								id="contacto-nombre"
								name="nombre"
								type="text"
								value={datos.nombre}
								onChange={handleChange}
								className={styles.input}
								pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+"
								required
							/>
						</div>
						<div className={styles.row}>
							<div className={styles.field}>
								<label className={styles.label} htmlFor="contacto-correo">
									Correo electronico: *
								</label>
								<input
									id="contacto-correo"
									name="correo"
									type="email"
									value={datos.correo}
									onChange={handleChange}
									className={styles.input}
									required
								/>
							</div>
							<div className={styles.field}>
									<label className={styles.label} htmlFor="contacto-telefono">
										Telefono: *
								</label>
								<div className={styles.phoneRow}>
									<select
										id="contacto-extension"
										name="telefonoExtension"
										value={datos.telefonoExtension}
										onChange={handleChange}
										className={styles.select}
									>
										{extensiones.map((ext) => (
											<option key={ext.id} value={ext.id}>
												{ext.label} ({ext.dial})
											</option>
										))}
									</select>
									<input
										id="contacto-telefono"
										name="telefono"
										type="tel"
										value={datos.telefono}
										onChange={handleChange}
										className={styles.input}
										placeholder="Numero de telefono"
										inputMode="numeric"
										pattern="\d{8}"
										required
									/>
								</div>
							</div>
						</div>
						<div className={styles.field}>
							<label className={styles.label} htmlFor="contacto-mensaje">
								Mensaje: *
							</label>
							<textarea
								id="contacto-mensaje"
								name="mensaje"
								value={datos.mensaje}
								onChange={handleChange}
								className={styles.textarea}
								required
							/>
						</div>
						<button
							type="submit"
							disabled={cargando}
							className={styles.submit}
						>
							{cargando ? "Enviando..." : "Enviar mensaje"}
						</button>
					</form>
				</div>
			</div>
			{mostrarModal && (
				<div className={styles.modal} role="dialog" aria-modal="true">
					<div className={styles.modalContent}>
						<div className={styles.modalIcon}>✓</div>
						<h3 className={styles.modalTitle}>Mensaje enviado</h3>
						<p className={styles.modalText}>
							Hemos recibido tus datos correctamente. Un asesor de SkyShip Express se pondra
							en contacto contigo muy pronto.
						</p>
						<button
							type="button"
							className={styles.modalButton}
							onClick={() => setMostrarModal(false)}
						>
							Cerrar
						</button>
					</div>
				</div>
			)}
		</section>
	);
}
