type Vec2D = { x: number; y: number }
type Box = {
  x: number
  y: number
  w: number
  h: number
}

export function open_in_new_tab(href: string) {
  const newWindow = window.open(href, '_blank')
  newWindow?.focus()
}

export function open_in_new_box(href: string) {
  window.open(href, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes')
}

export function compare_object(obj1: object, obj2: object): boolean {
  for (const key in obj1) {
    if (obj1[key] != obj2[key]) return false
  }
  return true
}

export function compare_array(arr1: unknown[], arr2: unknown[]): boolean {
  if (arr1.length !== arr2.length) return false
  for (let i = 0; i < arr1.length; i++) {
    const a = arr1[i]!
    const b = arr2[i]!
    if (typeof a !== typeof b) return false
    if (a !== null && b !== null && typeof a === 'object') {
      if (!compare_object(a, b)) return false
    } else {
      if (arr1[i] !== arr2[i]) return false
    }
  }
  return true
}

export function copy_vector(vec1: Vec2D, vec2: Vec2D) {
  vec2.x = vec1.x
  vec2.y = vec1.y
}

/** A better name might be vec_from_b_to_a */
export function get_vector(vec1: Vec2D, vec2: Vec2D) {
  return {
    x: vec1.x - vec2.x,
    y: vec1.y - vec2.y,
  }
}

export function mul_vector(vec: Vec2D, factor: number) {
  vec.x *= factor
  vec.y *= factor
}

export function scalar_product(vec1: Vec2D, vec2: Vec2D) {
  return vec1.x * vec2.x + vec1.y * vec2.y
}

export function norm(vec: Vec2D) {
  return Math.hypot(vec.x, vec.y)
}

/** A better name might be biased_sign */
export function sign(number: number) {
  return number < 0 ? -1 : 1
}

export function cross_product(vec1: Vec2D, vec2: Vec2D) {
  return vec1.x * vec2.y - vec1.y * vec2.x
}

export function get_angle_2(x1, y1, x2, y2) {
  const dy = y2 - y1
  const dx = x2 - x1
  return Math.atan2(dy, dx)
}

export function get_angle(vec1: Vec2D, vec2: Vec2D) {
  return Math.acos(scalar_product(vec1, vec2) / (norm(vec1) * norm(vec2))) * sign(cross_product(vec1, vec2))
}

/** A better name might be getSearchParam */
export function getURLData(key: string) {
  return new URLSearchParams(location.search).get(key)
}

const TwoPI = Math.PI * 2
export function reduceAngle(rad1: number, rad2: number) {
  rad2 = ((rad2 % TwoPI) + TwoPI) % TwoPI
  if (Math.abs(rad1 - rad2) > Math.PI) {
    if (rad1 > rad2) {
      return rad2 + TwoPI
    } else {
      return rad2 - TwoPI
    }
  }
  return rad2
}

export function get_std_angle(vec1: Vec2D, vec2: Vec2D) {
  return get_angle(
    {
      x: 1,
      y: 0,
    },
    get_vector(vec1, vec2),
  )
}

export function dist(vec1: Vec2D, vec2: Vec2D) {
  return Math.hypot(vec2.x - vec1.x, vec2.y - vec1.y)
}

/** A better name might be polar_to_vec */
export function build_vector(distance: number, rad: number): Vec2D {
  return {
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance,
  }
}

export function add_vector(vec1: Vec2D, vec2: Vec2D) {
  vec1.x += vec2.x
  vec1.y += vec2.y
}

export function sub_vector(vec1: Vec2D, vec2: Vec2D) {
  vec1.x -= vec2.x
  vec1.y -= vec2.y
}

export function translate_vector(vec: Vec2D, dx: number, dy: number) {
  vec.x += dx
  vec.y += dy
}

export function translate_new_vector(vec: Vec2D, dx: number, dy: number): Vec2D {
  return {
    x: vec.x + dx,
    y: vec.y + dy,
  }
}

/** A better name might be translate_polar */
export function move(vec: Vec2D, distance: number, rad: number) {
  vec.x += Math.cos(rad) * distance
  vec.y += Math.sin(rad) * distance
}

/** A better name might be mean_floored_integer */
export function middle(num1: number, num2: number) {
  return Math.floor((num2 - num1) / 2)
}

export function middle_point(vec1: Vec2D, vec2: Vec2D) {
  return {
    x: (vec1.x + vec2.x) / 2,
    y: (vec1.y + vec2.y) / 2,
  }
}

export function rand_sign() {
  return Math.random() > 0.5 ? 1 : -1
}

export function get_rand_pos_in_circle(x: number, y: number, radius: number) {
  const sign1 = rand_sign()
  const sign2 = rand_sign()
  const angle = (Math.random() * Math.PI) / 2
  return {
    x: Math.floor(x + Math.cos(angle) * sign1 * radius),
    y: Math.floor(y + Math.sin(angle) * sign2 * radius),
  }
}

/** A better name might be shuffle_array */
export function randomize_list<T>(input: T[]): T[] {
  const copy = [...input]
  const shuffled: T[] = []
  while (copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length)
    shuffled.push(copy[i]!)
    copy.splice(i, 1)
  }
  return shuffled
}

export function restore_number(num: number): number {
  if (num >= 20000) {
    num = (num - 20000) * 1000
  } else if (num >= 10000) {
    num = (num - 10000) * 100
  }
  return num
}

/** A better name might be pretty_print_number */
export function simplify_number(input: unknown): string {
  if (typeof input !== 'number') {
    return '0'
  } else if (input >= 10000) {
    const abbreviations = ['', 'k', 'm', 'b', 't']
    const logValue = Math.floor(Math.log10(input))
    const abbreviationIndex = Math.floor(logValue / 3)
    const abbreviatedValue = input / Math.pow(10, abbreviationIndex * 3)
    const decimalPlaces = abbreviatedValue < 10 ? 1 : 0
    const stringified = abbreviatedValue.toFixed(decimalPlaces)
    return stringified + abbreviations[abbreviationIndex]
  } else {
    return input.toString()
  }
}

export function ease_out_quad(num: number) {
  return num * (2 - num)
}

export function ease_out_cubic(num: number) {
  return --num * num * num + 1
}

export function ease_in_out_quad(num: number) {
  if (num < 0.5) {
    return num * 2 * num
  } else {
    return -1 + (4 - num * 2) * num
  }
}

export function ease_in_out_cubic(num: number) {
  if (num < 0.5) {
    return num * 4 * num * num
  } else {
    return (num - 1) * (num * 2 - 2) * (num * 2 - 2) + 1
  }
}

export function ease_in_out_quart(num: number) {
  if (num < 0.5) {
    return num * 8 * num * num * num
  } else {
    return 1 - --num * 8 * num * num * num
  }
}

export function ease_out_quart(num: number) {
  return 1 - --num * num * num * num
}

export function ease_out_quint(num: number) {
  return 1 + --num * num * num * num * num
}

export class LinearAnimation {
  last = 0
  constructor(
    // is reversing
    public o: boolean,

    // passed time
    public v: number,

    // end time
    public max: number,

    // start time
    public min: number,

    // forward speed
    public max_speed: number,

    // backward speed
    public min_speed: number,
  ) {}
  update() {
    if (this.o) {
      const t = this.v + globalThis.delta * this.max_speed
      if (t > this.max) {
        this.v = this.max
        this.o = false
        return true
      } else {
        this.v = t
      }
    } else {
      var t = this.v - globalThis.delta * this.min_speed
      if (t < this.min) {
        this.v = this.min
        this.o = true
      } else {
        this.v = t
      }
    }
    return undefined
  }
}

export class Ease {
  constructor(
    // easing function
    public fun: (number: number) => number,
    public ed: number,
    public em: number,
    public sx: number,
    public x: number,
    public ex: number,
  ) {}
  restart() {
    // ! this.sex is not defined
    // original code: this.x = this.sex
    console.trace('Ease.prototype.restart was called')
    this.x = 0
    this.ed = 0
  }
  ease(real_value: number) {
    if (real_value !== this.ex) {
      this.ex = real_value
      this.sx = this.x
      this.ed = 0
    }
    if (this.ex !== this.x) {
      this.ed += globalThis.delta
      if (this.ed > this.em) {
        this.x = this.ex
      } else {
        const eased = this.fun(this.ed / this.em)
        this.x = this.sx + (this.ex - this.sx) * eased
      }
    }
  }
}

export class Ease2d {
  constructor(
    // easing function
    public fun: (number: number) => number,
    public ed: number,
    public em: number,
    public sx: number,
    public sy: number,
    public x: number,
    public y: number,
    public ex: number,
    public ey: number,
  ) {}
  ease(real: Vec2D) {
    if (real.x != this.ex || real.y != this.ey) {
      this.ex = real.x
      this.ey = real.y
      this.sx = this.x
      this.sy = this.y
      this.ed = 0
    }
    if (this.ex != this.x || this.ey != this.y) {
      this.ed += globalThis.delta
      if (this.ed > this.em) {
        this.x = this.ex
        this.y = this.ey
      } else {
        const eased = this.fun(this.ed / this.em)
        this.x = this.sx + (this.ex - this.sx) * eased
        this.y = this.sy + (this.ey - this.sy) * eased
      }
    }
  }
}

export function generate_token(length: number) {
  return String.fromCharCode(
    ...Array(length)
      .fill(0)
      .map(() => 48 + Math.floor(Math.random() * 74)),
  )
}

export function inside_box(vec: Vec2D, box: Box) {
  return vec.x >= box.x && vec.x <= box.x + box.w && vec.y >= box.y && vec.y <= box.y + box.h
}

export function intersect_aabb(
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  x3: number,
  x4: number,
  y3: number,
  y4: number,
) {
  if (Math.max(x1, x3) < Math.min(x2, x4) && Math.max(y1, y3) < Math.min(y2, y4)) {
    return 1
  }
  return 0
}

export function lerp(min: number, max: number, progress: number) {
  return (1 - progress) * min + progress * max
}

export function escape_html(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
