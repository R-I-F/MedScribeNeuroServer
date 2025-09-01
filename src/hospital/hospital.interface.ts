export interface IHospital{
    arabName: string,
    engName: string,
    location?: {
        long: number , 
        lat: number
    }
}