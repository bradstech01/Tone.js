import { InputNode, OutputNode, ToneAudioNode, ToneAudioNodeOptions } from "../../core/context/ToneAudioNode";
import { dbToGain } from "../../core/type/Conversions";
import { NormalRange, PowerOfTwo } from "../../core/type/Units";
import { optionsFromArguments } from "../../core/util/Defaults";
import { Analyser } from "./Analyser";

export interface FFTOptions extends ToneAudioNodeOptions {
	size: PowerOfTwo;
	smoothing: NormalRange;
	normalRange: boolean;
}

/**
 * Get the current frequency data of the connected audio source using a fast Fourier transform.
 */
export class FFT extends ToneAudioNode<FFTOptions> {

	readonly name: string = "FFT";

	/**
	 * The signal to be analysed
	 */
	input: InputNode;

	/**
	 * The output is just a pass through of the input
	 */
	output: OutputNode;

	/**
	 * The analyser node for the incoming signal
	 */
	private _analyser: Analyser;

	/**
	 * If the output should be in decibels or normal range between 0-1. If `normalRange` is false,
	 * the output range will be the measured decibel value, otherwise the decibel value will be converted to
	 * the range of 0-1
	 */
	normalRange: boolean;

	/**
	 * @param size size The size of the FFT. Value must be a power of two in the range 16 to 16384.
	 */
	constructor(size?: PowerOfTwo);
	// tslint:disable-next-line: unified-signatures
	constructor(options?: Partial<FFTOptions>);
	constructor() {
		super(optionsFromArguments(FFT.getDefaults(), arguments, ["size"]));
		const options = optionsFromArguments(FFT.getDefaults(), arguments, ["size"]);

		this.normalRange = options.normalRange;
		this.input = this.output = this._analyser = new Analyser({
			context: this.context,
			size: options.size,
			type: "fft",
		});
	}

	static getDefaults(): FFTOptions {
		return Object.assign(ToneAudioNode.getDefaults(), {
			normalRange: false,
			size: 1024,
			smoothing: 0.8,
		});
	}

	/**
	 *  Gets the current frequency data from the connected audio source.
	 *  Returns the frequency data of length [[size]] as a Float32Array of decibel values.
	 */
	getValue(): Float32Array {
		return this._analyser.getValue().map(v => this.normalRange ? dbToGain(v) : v);
	}

	/**
	 *  The size of analysis. This must be a power of two in the range 16 to 16384.
	 *  Determines the size of the array returned by [[getValue]] (i.e. the number of
	 *  frequency bins). Large FFT sizes may be costly to compute.
	 */
	get size(): PowerOfTwo {
		return this._analyser.size;
	}
	set size(size) {
		this._analyser.size = size;
	}

	/**
	 *  0 represents no time averaging with the last analysis frame.
	 */
	get smoothing(): NormalRange {
		return this._analyser.smoothing;
	}
	set smoothing(val) {
		this._analyser.smoothing = val;
	}

	dispose(): this {
		super.dispose();
		this._analyser.dispose();
		return this;
	}
}
