<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class RegisterRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'nom' => ['required','string','min:2','max:150'],
            'email' => ['required','email','max:255','unique:users,email'],
            'telephone' => ['required','string','regex:/^\+?[0-9 ().-]{8,20}$/'],
            'password' => ['required','string','min:8','confirmed'],
            'ville' => ['sometimes','string','max:100'],
        ];
    }
}
